/**
 * Terraform Infrastructure Diagram Component
 * Main canvas for visualizing and editing Terraform resources
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import { nodeTypes } from './nodes';
import { TerraformResource } from '../../types/terraform';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectFilteredResources,
  selectSelectedResource,
  selectResource,
  updateResourcePosition,
  selectDiagramFilter,
} from '../../store/terraformSlice';

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 180;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  // Separate root nodes (containers) from child nodes
  const rootNodes = nodes.filter(n => !n.parentNode);
  const childNodes = nodes.filter(n => n.parentNode);

  // Group children by parent
  const childrenByParent = new Map<string, Node[]>();
  childNodes.forEach(node => {
    if (node.parentNode) {
      if (!childrenByParent.has(node.parentNode)) {
        childrenByParent.set(node.parentNode, []);
      }
      childrenByParent.get(node.parentNode)!.push(node);
    }
  });

  // Layout root/container nodes using dagre
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 200, ranksep: 250 });

  rootNodes.forEach((node) => {
    // Calculate size based on contained children
    const childCount = childrenByParent.get(node.id)?.length || 0;
    const width = Math.max(800, childCount > 2 ? childCount * 350 : 800);
    const height = Math.max(500, Math.ceil(childCount / 2) * 250);

    dagreGraph.setNode(node.id, { width, height });
  });

  // Add edges only between root nodes
  edges.forEach((edge) => {
    const sourceIsRoot = rootNodes.some(n => n.id === edge.source);
    const targetIsRoot = rootNodes.some(n => n.id === edge.target);
    if (sourceIsRoot && targetIsRoot) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  // Position root nodes
  rootNodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    node.position = {
      x: nodeWithPosition.x - (nodeWithPosition.width / 2),
      y: nodeWithPosition.y - (nodeWithPosition.height / 2),
    };
  });

  // Position children within their parents
  childrenByParent.forEach((children, parentId) => {
    const cols = Math.min(3, Math.ceil(Math.sqrt(children.length)));

    children.forEach((child, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Position relative to parent (0,0 is top-left of parent)
      child.position = {
        x: 50 + col * 300,
        y: 100 + row * 220,
      };

      child.targetPosition = Position.Top;
      child.sourcePosition = Position.Bottom;
    });
  });

  return { nodes, edges };
};

interface TerraformDiagramProps {
  projectId: string;
}

const TerraformDiagram: React.FC<TerraformDiagramProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const resources = useAppSelector(selectFilteredResources);
  const selectedResource = useAppSelector(selectSelectedResource);
  const diagramFilter = useAppSelector(selectDiagramFilter);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert Terraform resources to ReactFlow nodes
  const convertResourcesToNodes = useCallback((resources: TerraformResource[]): Node[] => {
    return resources.map((resource) => {
      const savedPosition = resource.metadata?.position;

      // Determine if this resource is a container
      const isContainer = resource.is_container;

      // Set node type: 'container' for containers, otherwise resource_type
      const nodeType = isContainer ? 'container' : resource.resource_type;

      // Calculate extent for parent containment
      // Children are constrained to parent bounds
      const extent: [number, number] | 'parent' | undefined =
        resource.parent_resource ? 'parent' : undefined;

      return {
        id: resource.id,
        type: nodeType,
        position: savedPosition || { x: 0, y: 0 },
        data: {
          resource,
          label: resource.resource_name,
          resourceType: resource.resource_type,
          provider: resource.provider_name || 'unknown',
          status: resource.status,
          configuration: resource.configuration,
          hierarchyPath: resource.hierarchy_path,
          containedCount: resource.contained_resources_count || 0,
        },
        // Set parent node for hierarchy
        parentNode: resource.parent_resource || undefined,
        extent,
        // Expand parent to fit children
        expandParent: true,
        // Draggable only if not in a parent (for now)
        draggable: !resource.parent_resource,
      };
    });
  }, []);

  // Convert dependencies to ReactFlow edges
  const convertDependenciesToEdges = useCallback((resources: TerraformResource[]): Edge[] => {
    const edges: Edge[] = [];

    resources.forEach((resource) => {
      resource.dependencies_from?.forEach((dep) => {
        if (dep.to_resource_id) {
          edges.push({
            id: `${resource.id}-${dep.to_resource_id}`,
            source: resource.id,
            target: dep.to_resource_id,
            type: 'smoothstep',
            animated: dep.dependency_type === 'explicit',
            label: dep.dependency_type === 'explicit' ? 'depends_on' : undefined,
            style: {
              stroke: dep.dependency_type === 'explicit' ? '#f59e0b' : '#6b7280',
              strokeWidth: 2,
            },
          });
        }
      });
    });

    return edges;
  }, []);

  // Auto-layout nodes and edges
  const applyAutoLayout = useCallback(() => {
    const newNodes = convertResourcesToNodes(resources);
    const newEdges = convertDependenciesToEdges(resources);

    if (newNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        newNodes,
        newEdges,
        'LR'
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [resources, convertResourcesToNodes, convertDependenciesToEdges, setNodes, setEdges]);

  // Apply auto-layout when resources change
  useEffect(() => {
    applyAutoLayout();
  }, [applyAutoLayout]);

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      dispatch(selectResource(node.id));
    },
    [dispatch]
  );

  // Handle node drag end - save position
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      dispatch(
        updateResourcePosition({
          id: node.id,
          x: node.position.x,
          y: node.position.y,
        })
      );
    },
    [dispatch]
  );

  // Handle edge connection
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      // TODO: Create dependency in backend
    },
    [setEdges]
  );

  // Minimap node color based on status
  const minimapNodeColor = useCallback((node: Node) => {
    const status = node.data?.status;
    const colorMap: Record<string, string> = {
      created: '#10b981',
      planning: '#3b82f6',
      applying: '#f59e0b',
      error: '#ef4444',
      destroyed: '#6b7280',
      unknown: '#9ca3af',
    };
    return colorMap[status] || '#9ca3af';
  }, []);

  // Show filter badge if filters applied
  const hasFilters = useMemo(
    () =>
      diagramFilter.resourceTypes.length > 0 ||
      diagramFilter.providers.length > 0 ||
      diagramFilter.status.length > 0,
    [diagramFilter]
  );

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap nodeColor={minimapNodeColor} />

        {/* Top-left panel for filters and info */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-md p-3 m-2">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {resources.length} Resources
          </div>
          {hasFilters && (
            <div className="text-xs text-blue-600">
              🔍 Filters active
            </div>
          )}
        </Panel>

        {/* Top-right panel for layout controls */}
        <Panel position="top-right" className="space-x-2 m-2">
          <button
            onClick={applyAutoLayout}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md text-sm font-medium transition-colors"
          >
            ↻ Auto Layout
          </button>
        </Panel>

        {/* Empty state - shown as overlay */}
        {resources.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md pointer-events-auto">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Resources Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by importing a Terraform project or adding resources from the palette.
              </p>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
};

export default TerraformDiagram;
