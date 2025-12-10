/**
 * Terraform Infrastructure Diagram Component
 * Main canvas for visualizing and editing Terraform resources using HTML5 Canvas API
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dagre from 'dagre';

import { TerraformResource, canContain } from '../../types/terraform';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectFilteredResources,
  selectSelectedResource,
  selectResource,
  updateResourcePosition,
  selectDiagramFilter,
  createResource,
  fetchProjectDetail,
} from '../../store/terraformSlice';
import AddChildResourceModal from './AddChildResourceModal';
import AddRootResourceButton from './AddRootResourceButton';

// Canvas imports
import {
  CanvasRenderer,
  CanvasEventHandler,
  CanvasNode,
  CanvasEdge,
  CanvasState,
  Transform,
} from './canvas';

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

/**
 * General resource sizing configuration
 * Add new resource types here with minimal configuration
 */
interface ResourceSizeConfig {
  width: number;
  height: number;
  padding?: number;
  minWidth?: number;
  minHeight?: number;
}

/**
 * Default sizes for all resource types
 * Containers will auto-size based on children
 */
const RESOURCE_SIZES: Record<string, ResourceSizeConfig> = {
  // Default for any unknown resource
  default: { width: 250, height: 180, padding: 60 },

  // Standard resources (non-containers)
  aws_instance: { width: 250, height: 180 },
  aws_db_instance: { width: 250, height: 200 },
  aws_lambda_function: { width: 250, height: 180 },
  aws_s3_bucket: { width: 250, height: 160 },
  aws_security_group: { width: 250, height: 180 },

  // Containers (these are default sizes, will grow based on content)
  aws_vpc: { width: 800, height: 500, padding: 80, minWidth: 800, minHeight: 500 },
  aws_subnet: { width: 400, height: 300, padding: 60, minWidth: 400, minHeight: 300 },
  aws_autoscaling_group: { width: 450, height: 320, padding: 60, minWidth: 450, minHeight: 320 },
  aws_ecs_cluster: { width: 450, height: 320, padding: 60, minWidth: 450, minHeight: 320 },
  aws_ecs_service: { width: 400, height: 300, padding: 60, minWidth: 400, minHeight: 300 },
};

/**
 * Get size configuration for a resource type
 */
const getResourceSize = (resourceType: string): ResourceSizeConfig => {
  return RESOURCE_SIZES[resourceType] || RESOURCE_SIZES.default;
};

/**
 * Layout configuration for children within containers
 */
const LAYOUT_CONFIG = {
  columns: 3,              // Number of columns in grid layout
  horizontalSpacing: 40,   // Space between nodes horizontally
  verticalSpacing: 40,     // Space between nodes vertically
  headerHeight: 80,        // Space for container header
  bottomPadding: 50,       // Extra space at bottom for "Add Resource" button
};

/**
 * Temporary node type for Dagre layout
 */
interface LayoutNode {
  id: string;
  data: {
    resource: TerraformResource;
    label: string;
    resourceType: string;
    provider: string;
    status: string;
    configuration: Record<string, any>;
    hierarchyPath: string;
    containedCount: number;
  };
  position: { x: number; y: number };
  parentNode?: string;
  calculatedWidth?: number;
  calculatedHeight?: number;
}

/**
 * Calculate container size based on its children (bottom-up recursive)
 * Works from innermost resources outward
 */
const calculateContainerSize = (
  node: LayoutNode,
  childrenByParent: Map<string, LayoutNode[]>
): { width: number; height: number } => {
  const children = childrenByParent.get(node.id) || [];
  const sizeConfig = getResourceSize(node.data.resourceType);
  const isContainer = node.data.resource.is_container;

  // Non-containers use their default size
  if (!isContainer || children.length === 0) {
    return {
      width: sizeConfig.width,
      height: sizeConfig.height,
    };
  }

  // First, recursively calculate sizes for all children
  children.forEach(child => {
    if (!child.calculatedWidth || !child.calculatedHeight) {
      const childSize = calculateContainerSize(child, childrenByParent);
      child.calculatedWidth = childSize.width;
      child.calculatedHeight = childSize.height;
    }
  });

  // Calculate grid layout for children
  const cols = Math.min(LAYOUT_CONFIG.columns, children.length);
  const rows = Math.ceil(children.length / cols);

  // Calculate total content width (sum of widest items in each column)
  let totalContentWidth = 0;
  for (let col = 0; col < cols; col++) {
    let maxWidthInColumn = 0;
    for (let row = 0; row < rows; row++) {
      const index = row * cols + col;
      if (index < children.length) {
        maxWidthInColumn = Math.max(maxWidthInColumn, children[index].calculatedWidth || 0);
      }
    }
    totalContentWidth += maxWidthInColumn;
  }

  // Add spacing between columns
  totalContentWidth += (cols - 1) * LAYOUT_CONFIG.horizontalSpacing;

  // Calculate total content height (sum of tallest items in each row)
  let totalContentHeight = 0;
  for (let row = 0; row < rows; row++) {
    let maxHeightInRow = 0;
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (index < children.length) {
        maxHeightInRow = Math.max(maxHeightInRow, children[index].calculatedHeight || 0);
      }
    }
    totalContentHeight += maxHeightInRow;
  }

  // Add spacing between rows
  totalContentHeight += (rows - 1) * LAYOUT_CONFIG.verticalSpacing;

  // Calculate container size with padding
  const padding = sizeConfig.padding || 60;
  const calculatedWidth = totalContentWidth + padding * 2;
  const calculatedHeight = totalContentHeight + LAYOUT_CONFIG.headerHeight + LAYOUT_CONFIG.bottomPadding + padding;

  // Apply minimum sizes
  const finalWidth = Math.max(calculatedWidth, sizeConfig.minWidth || sizeConfig.width);
  const finalHeight = Math.max(calculatedHeight, sizeConfig.minHeight || sizeConfig.height);

  return { width: finalWidth, height: finalHeight };
};

/**
 * Apply Dagre hierarchical layout to nodes
 */
const getLayoutedElements = (
  nodes: LayoutNode[],
  edges: CanvasEdge[],
  direction = 'LR'
) => {
  // Separate root nodes (containers) from child nodes
  const rootNodes = nodes.filter(n => !n.parentNode);
  const childNodes = nodes.filter(n => n.parentNode);

  // Group children by parent
  const childrenByParent = new Map<string, LayoutNode[]>();
  childNodes.forEach(node => {
    if (node.parentNode) {
      if (!childrenByParent.has(node.parentNode)) {
        childrenByParent.set(node.parentNode, []);
      }
      childrenByParent.get(node.parentNode)!.push(node);
    }
  });

  // Calculate sizes for all nodes (bottom-up, innermost first)
  [...childNodes, ...rootNodes].forEach(node => {
    const size = calculateContainerSize(node, childrenByParent);
    node.calculatedWidth = size.width;
    node.calculatedHeight = size.height;
  });

  // Layout root/container nodes using dagre
  dagreGraph.setGraph({ rankdir: direction, nodesep: 200, ranksep: 250 });

  rootNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.calculatedWidth!,
      height: node.calculatedHeight!,
    });
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
    node.position = {
      x: nodeWithPosition.x - (nodeWithPosition.width / 2),
      y: nodeWithPosition.y - (nodeWithPosition.height / 2),
    };
  });

  // Position children within their parents using dynamic grid layout
  childrenByParent.forEach((children, parentId) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const parentConfig = getResourceSize(parent.data.resourceType);
    const padding = parentConfig.padding || 60;
    const cols = Math.min(LAYOUT_CONFIG.columns, children.length);

    // Calculate column widths based on actual child sizes
    const columnWidths: number[] = [];
    for (let col = 0; col < cols; col++) {
      let maxWidth = 0;
      children.forEach((child, index) => {
        if (index % cols === col) {
          maxWidth = Math.max(maxWidth, child.calculatedWidth || 0);
        }
      });
      columnWidths.push(maxWidth);
    }

    // Calculate row heights based on actual child sizes
    const rows = Math.ceil(children.length / cols);
    const rowHeights: number[] = [];
    for (let row = 0; row < rows; row++) {
      let maxHeight = 0;
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index < children.length) {
          maxHeight = Math.max(maxHeight, children[index].calculatedHeight || 0);
        }
      }
      rowHeights.push(maxHeight);
    }

    // Position each child in the grid
    children.forEach((child, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Calculate X position (sum of previous column widths + spacing)
      let x = padding;
      for (let c = 0; c < col; c++) {
        x += columnWidths[c] + LAYOUT_CONFIG.horizontalSpacing;
      }

      // Calculate Y position (sum of previous row heights + spacing + header)
      let y = LAYOUT_CONFIG.headerHeight;
      for (let r = 0; r < row; r++) {
        y += rowHeights[r] + LAYOUT_CONFIG.verticalSpacing;
      }

      // Position relative to parent (0,0 is top-left of parent)
      child.position = { x, y };
    });
  });

  return { nodes, edges };
};

/**
 * Recursively calculate absolute position by traversing up the parent chain
 */
const calculateAbsolutePosition = (
  layoutNode: LayoutNode,
  nodeMap: Map<string, LayoutNode>
): { x: number; y: number } => {
  let absoluteX = layoutNode.position.x;
  let absoluteY = layoutNode.position.y;

  // Traverse up the parent chain and sum all relative positions
  let currentNode = layoutNode;
  while (currentNode.parentNode) {
    const parent = nodeMap.get(currentNode.parentNode);
    if (parent) {
      absoluteX += parent.position.x;
      absoluteY += parent.position.y;
      currentNode = parent;
    } else {
      break;
    }
  }

  return { x: absoluteX, y: absoluteY };
};

/**
 * Convert LayoutNode to CanvasNode using calculated sizes
 */
const convertToCanvasNode = (
  layoutNode: LayoutNode,
  nodeMap: Map<string, LayoutNode>
): CanvasNode => {
  const resource = layoutNode.data.resource;
  const hierarchyDepth = resource.hierarchy_path ? resource.hierarchy_path.split('/').length : 0;

  // Calculate absolute position by traversing up the entire parent chain
  const { x: absoluteX, y: absoluteY } = calculateAbsolutePosition(layoutNode, nodeMap);

  // Use calculated dimensions from layout algorithm
  const width = layoutNode.calculatedWidth || getResourceSize(layoutNode.data.resourceType).width;
  const height = layoutNode.calculatedHeight || getResourceSize(layoutNode.data.resourceType).height;

  return {
    id: layoutNode.id,
    label: layoutNode.data.label,
    resourceType: layoutNode.data.resourceType,
    status: layoutNode.data.status as any,
    configuration: layoutNode.data.configuration,
    isContainer: resource.is_container,
    containedCount: layoutNode.data.containedCount || 0,
    parentId: layoutNode.parentNode,
    bounds: {
      x: absoluteX,
      y: absoluteY,
      width,
      height,
    },
    zIndex: hierarchyDepth * 10,
    handles: {
      source: layoutNode.parentNode ? 'bottom' : 'right',
      target: layoutNode.parentNode ? 'top' : 'left',
    },
  };
};

interface TerraformDiagramProps {
  projectId: string;
}

const TerraformDiagram: React.FC<TerraformDiagramProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const resources = useAppSelector(selectFilteredResources);
  const selectedResource = useAppSelector(selectSelectedResource);
  const diagramFilter = useAppSelector(selectDiagramFilter);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const eventHandlerRef = useRef<CanvasEventHandler | null>(null);

  // Canvas state
  const [canvasState, setCanvasState] = useState<CanvasState>({
    transform: { x: 0, y: 0, zoom: 1 },
    selectedNodeId: selectedResource?.id || null,
    hoveredNodeId: null,
    dragState: null,
    panState: null,
    dropTargetId: null,
  });

  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>([]);
  const [showRootResourceModal, setShowRootResourceModal] = useState(false);
  const [selectedRootResourceType, setSelectedRootResourceType] = useState<string | null>(null);

  // Handle adding root resource
  const handleAddRootResource = useCallback((resourceType: string) => {
    setSelectedRootResourceType(resourceType);
    setShowRootResourceModal(true);
    console.log('Add root resource:', resourceType);
  }, []);

  // Convert Terraform resources to layout nodes (compatible with existing Dagre logic)
  const convertResourcesToNodes = useCallback((resources: TerraformResource[]): LayoutNode[] => {
    return resources.map((resource) => {
      const savedPosition = resource.metadata?.position;

      return {
        id: resource.id,
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
        parentNode: resource.parent_resource || undefined,
      };
    });
  }, []);

  // Convert dependencies to canvas edges
  const convertDependenciesToEdges = useCallback((resources: TerraformResource[]): CanvasEdge[] => {
    const edges: CanvasEdge[] = [];

    resources.forEach((resource) => {
      resource.dependencies_from?.forEach((dep) => {
        if (dep.to_resource_id) {
          edges.push({
            id: `${resource.id}-${dep.to_resource_id}`,
            source: resource.id,
            target: dep.to_resource_id,
            isExplicit: dep.dependency_type === 'explicit',
            animated: dep.dependency_type === 'explicit',
            label: dep.dependency_type === 'explicit' ? 'depends_on' : undefined,
          });
        }
      });
    });

    return edges;
  }, []);

  // Apply auto-layout
  const applyAutoLayout = useCallback(() => {
    const layoutNodes = convertResourcesToNodes(resources);
    const edges = convertDependenciesToEdges(resources);

    if (layoutNodes.length > 0) {
      const { nodes: layoutedNodes } = getLayoutedElements(
        layoutNodes,
        edges,
        'LR'
      );

      // Convert to canvas nodes
      const nodeMap = new Map(layoutedNodes.map(n => [n.id, n]));
      const canvasNodes: CanvasNode[] = [];

      layoutedNodes.forEach(node => {
        canvasNodes.push(convertToCanvasNode(node, nodeMap));
      });

      setCanvasNodes(canvasNodes);
      setCanvasEdges(edges);
    } else {
      setCanvasNodes([]);
      setCanvasEdges([]);
    }
  }, [resources, convertResourcesToNodes, convertDependenciesToEdges]);

  // Apply auto-layout when resources change
  useEffect(() => {
    applyAutoLayout();
  }, [applyAutoLayout]);

  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }
  }, []);

  // Initialize event handler
  useEffect(() => {
    if (canvasRef.current && !eventHandlerRef.current) {
      eventHandlerRef.current = new CanvasEventHandler(
        canvasRef.current,
        canvasState,
        canvasNodes,
        {
          onStateChange: setCanvasState,
          onNodeSelect: (nodeId) => {
            if (nodeId) {
              dispatch(selectResource(nodeId));
            }
          },
          onNodeDragEnd: (nodeId, x, y) => {
            dispatch(updateResourcePosition({ id: nodeId, x, y }));
          },
          onAddResourceToContainer: (nodeId, resourceType) => {
            // This will be handled by the custom event system
          },
        }
      );
    }

    // Update event handler when state or nodes change
    if (eventHandlerRef.current) {
      eventHandlerRef.current.update(canvasState, canvasNodes);
    }
  }, [canvasState, canvasNodes, dispatch]);

  // Render canvas when nodes, edges, or state changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(canvasNodes, canvasEdges, canvasState);
    }
  }, [canvasNodes, canvasEdges, canvasState]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        if (rendererRef.current) {
          rendererRef.current.render(canvasNodes, canvasEdges, canvasState);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [canvasNodes, canvasEdges, canvasState]);

  // Handle drop from palette
  const handleCanvasDrop = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    if (!eventHandlerRef.current) return;

    const dropInfo = eventHandlerRef.current.handleDrop(e, canContain);

    if (dropInfo) {
      const { targetNode, worldCoords, resourceType } = dropInfo;

      if (targetNode) {
        // Dropped on container - trigger modal
        const event = new CustomEvent('addResourceToContainer', {
          detail: {
            parentId: targetNode.id,
            parentType: targetNode.resourceType,
            preselectedType: resourceType,
          },
        });
        window.dispatchEvent(event);
      } else {
        // Dropped on empty canvas - create root resource
        dispatch(createResource({
          project: projectId,
          resource_type: resourceType,
          resource_name: `${resourceType.split('_').pop()}_${Date.now()}`,
          terraform_address: `${resourceType}.resource_${Date.now()}`,
          configuration: {},
          metadata: { position: worldCoords },
        })).then(() => {
          dispatch(fetchProjectDetail(projectId));
        });
      }
    }
  }, [dispatch, projectId]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    if (eventHandlerRef.current) {
      eventHandlerRef.current.handleDragOver(e);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    if (eventHandlerRef.current) {
      eventHandlerRef.current.handleDragLeave(e);
    }
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
    <div ref={containerRef} className="w-full h-full bg-gray-50 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => eventHandlerRef.current?.handleMouseDown(e)}
        onMouseMove={(e) => eventHandlerRef.current?.handleMouseMove(e)}
        onMouseUp={(e) => eventHandlerRef.current?.handleMouseUp(e)}
        onWheel={(e) => eventHandlerRef.current?.handleWheel(e)}
        onDrop={handleCanvasDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      />

      {/* Top-left panel for filters and info */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 z-10 pointer-events-auto">
        <div className="text-sm font-medium text-gray-700 mb-2">
          {resources.length} Resources
        </div>
        {hasFilters && (
          <div className="text-xs text-blue-600">
            🔍 Filters active
          </div>
        )}
      </div>

      {/* Top-right panel for layout controls */}
      <div className="absolute top-4 right-4 space-x-2 z-10 pointer-events-auto">
        <button
          onClick={applyAutoLayout}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md text-sm font-medium transition-colors"
        >
          ↻ Auto Layout
        </button>
      </div>

      {/* Empty state */}
      {resources.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md pointer-events-auto">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Resources Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Click the + button in the bottom-right to add your first resource (like a VPC).
            </p>
          </div>
        </div>
      )}

      {/* Add Child Resource Modal */}
      <AddChildResourceModal
        projectId={projectId}
        onClose={() => {
          dispatch(fetchProjectDetail(projectId));
        }}
      />

      {/* Add Root Resource Button */}
      <AddRootResourceButton
        projectId={projectId}
        onAddResource={handleAddRootResource}
      />
    </div>
  );
};

export default TerraformDiagram;
