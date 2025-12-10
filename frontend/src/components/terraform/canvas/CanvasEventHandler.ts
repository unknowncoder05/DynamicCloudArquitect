/**
 * CanvasEventHandler - Handles all user interactions
 * Mouse events, drag-and-drop, pan, zoom, click selection
 */

import { CanvasNode, CanvasState, WorldCoords } from './types';
import { HitTester } from './HitTester';
import { screenToWorld, zoomTowardsPoint, panTransform } from './CanvasViewport';

/**
 * Event handler configuration
 */
interface EventHandlerConfig {
  onStateChange: (newState: CanvasState) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeDragEnd: (nodeId: string, x: number, y: number) => void;
  onAddResourceToContainer: (nodeId: string, resourceType: string) => void;
}

/**
 * CanvasEventHandler manages user interactions
 */
export class CanvasEventHandler {
  private canvas: HTMLCanvasElement;
  private state: CanvasState;
  private nodes: CanvasNode[];
  private config: EventHandlerConfig;
  private hitTester: HitTester;

  // Double-click detection
  private lastClickTime: number = 0;
  private lastClickedNodeId: string | null = null;
  private readonly DOUBLE_CLICK_DELAY = 300; // milliseconds

  constructor(
    canvas: HTMLCanvasElement,
    state: CanvasState,
    nodes: CanvasNode[],
    config: EventHandlerConfig
  ) {
    this.canvas = canvas;
    this.state = state;
    this.nodes = nodes;
    this.config = config;
    this.hitTester = new HitTester();
  }

  /**
   * Update state and nodes (call this when they change)
   */
  update(state: CanvasState, nodes: CanvasNode[]): void {
    this.state = state;
    this.nodes = nodes;
  }

  /**
   * Handle mouse down event
   */
  handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const rect = this.canvas.getBoundingClientRect();
    const worldCoords = screenToWorld(
      e.clientX,
      e.clientY,
      rect,
      this.state.transform
    );

    const clickedNode = this.hitTester.getNodeAtPoint(worldCoords, this.nodes);

    if (clickedNode) {
      // Check if clicked on "Add Resource" button
      if (this.hitTester.isPointInAddResourceButton(worldCoords, clickedNode)) {
        this.handleAddResourceClick(clickedNode);
        return;
      }

      // Detect double-click
      const currentTime = Date.now();
      const timeSinceLastClick = currentTime - this.lastClickTime;

      if (
        timeSinceLastClick < this.DOUBLE_CLICK_DELAY &&
        this.lastClickedNodeId === clickedNode.id
      ) {
        // Double-click detected - show properties panel
        this.handleDoubleClick(clickedNode);

        // Reset click tracking
        this.lastClickTime = 0;
        this.lastClickedNodeId = null;
        return;
      }

      // Update click tracking for double-click detection
      this.lastClickTime = currentTime;
      this.lastClickedNodeId = clickedNode.id;

      // Select node
      this.config.onNodeSelect(clickedNode.id);

      // Start drag if root node (non-children)
      if (!clickedNode.parentId) {
        const dragState = {
          nodeId: clickedNode.id,
          startPos: worldCoords,
          offset: {
            x: worldCoords.x - clickedNode.bounds.x,
            y: worldCoords.y - clickedNode.bounds.y,
          },
        };

        this.config.onStateChange({
          ...this.state,
          selectedNodeId: clickedNode.id,
          dragState,
        });
      } else {
        this.config.onStateChange({
          ...this.state,
          selectedNodeId: clickedNode.id,
        });
      }
    } else {
      // Clicked on empty space - deselect and start pan
      this.config.onNodeSelect(null);
      this.canvas.style.cursor = 'grabbing';

      // Reset click tracking
      this.lastClickTime = 0;
      this.lastClickedNodeId = null;

      this.config.onStateChange({
        ...this.state,
        selectedNodeId: null,
        panState: {
          startPos: { x: e.clientX, y: e.clientY },
          startTransform: { ...this.state.transform },
        },
      });
    }
  };

  /**
   * Handle mouse move event
   */
  handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const rect = this.canvas.getBoundingClientRect();
    const worldCoords = screenToWorld(
      e.clientX,
      e.clientY,
      rect,
      this.state.transform
    );

    if (this.state.dragState) {
      // Dragging node
      const newX = worldCoords.x - this.state.dragState.offset.x;
      const newY = worldCoords.y - this.state.dragState.offset.y;

      // Update node position immediately (optimistic update)
      // The parent component will handle Redux updates
      const updatedNodes = this.nodes.map(node =>
        node.id === this.state.dragState!.nodeId
          ? { ...node, bounds: { ...node.bounds, x: newX, y: newY } }
          : node
      );

      this.nodes = updatedNodes;
    } else if (this.state.panState) {
      // Panning canvas
      const dx = e.clientX - this.state.panState.startPos.x;
      const dy = e.clientY - this.state.panState.startPos.y;

      const newTransform = panTransform(
        this.state.panState.startTransform,
        dx,
        dy
      );

      this.config.onStateChange({
        ...this.state,
        transform: newTransform,
      });
    } else {
      // Hover detection
      const hoveredNode = this.hitTester.getNodeAtPoint(worldCoords, this.nodes);

      if (hoveredNode?.id !== this.state.hoveredNodeId) {
        // Update cursor
        if (hoveredNode) {
          if (this.hitTester.isPointInAddResourceButton(worldCoords, hoveredNode)) {
            this.canvas.style.cursor = 'pointer';
          } else {
            this.canvas.style.cursor = hoveredNode.parentId ? 'default' : 'move';
          }
        } else {
          this.canvas.style.cursor = 'default';
        }

        this.config.onStateChange({
          ...this.state,
          hoveredNodeId: hoveredNode?.id || null,
        });
      }
    }
  };

  /**
   * Handle mouse up event
   */
  handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (this.state.dragState) {
      // End node drag
      const rect = this.canvas.getBoundingClientRect();
      const worldCoords = screenToWorld(
        e.clientX,
        e.clientY,
        rect,
        this.state.transform
      );

      const newX = worldCoords.x - this.state.dragState.offset.x;
      const newY = worldCoords.y - this.state.dragState.offset.y;

      // Notify parent of drag end (for Redux update)
      this.config.onNodeDragEnd(this.state.dragState.nodeId, newX, newY);

      this.config.onStateChange({
        ...this.state,
        dragState: null,
      });
    } else if (this.state.panState) {
      // End pan
      this.canvas.style.cursor = 'grab';

      this.config.onStateChange({
        ...this.state,
        panState: null,
      });
    }
  };

  /**
   * Handle mouse wheel event (zoom)
   */
  handleWheel = (e: React.WheelEvent<HTMLCanvasElement>): void => {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const delta = e.deltaY * -0.001; // Zoom delta

    const newTransform = zoomTowardsPoint(
      this.state.transform,
      delta,
      { x: e.clientX, y: e.clientY },
      rect
    );

    this.config.onStateChange({
      ...this.state,
      transform: newTransform,
    });
  };

  /**
   * Handle "Add Resource" button click
   */
  private handleAddResourceClick(node: CanvasNode): void {
    // Trigger custom event for modal
    const event = new CustomEvent('addResourceToContainer', {
      detail: {
        parentId: node.id,
        parentType: node.resourceType,
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle double-click on a node
   */
  private handleDoubleClick(node: CanvasNode): void {
    // Trigger custom event to show properties panel
    const event = new CustomEvent('showResourceProperties', {
      detail: {
        resourceId: node.id,
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle drag over event (from ComponentPalette)
   */
  handleDragOver = (e: React.DragEvent<HTMLCanvasElement>): void => {
    e.preventDefault();

    const hasResourceType = e.dataTransfer.types.includes('resourcetype');

    if (hasResourceType) {
      const rect = this.canvas.getBoundingClientRect();
      const worldCoords = screenToWorld(
        e.clientX,
        e.clientY,
        rect,
        this.state.transform
      );

      const targetNode = this.hitTester.getNodeAtPoint(worldCoords, this.nodes);

      // Show drop feedback
      if (targetNode && targetNode.isContainer) {
        e.dataTransfer.dropEffect = 'copy';

        this.config.onStateChange({
          ...this.state,
          dropTargetId: targetNode.id,
        });
      } else {
        e.dataTransfer.dropEffect = 'copy';

        this.config.onStateChange({
          ...this.state,
          dropTargetId: null,
        });
      }
    }
  };

  /**
   * Handle drag leave event
   */
  handleDragLeave = (e: React.DragEvent<HTMLCanvasElement>): void => {
    // Only clear drop target if actually leaving canvas
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !this.canvas.contains(relatedTarget)) {
      this.config.onStateChange({
        ...this.state,
        dropTargetId: null,
      });
    }
  };

  /**
   * Handle drop event (from ComponentPalette)
   */
  handleDrop = (
    e: React.DragEvent<HTMLCanvasElement>,
    canContainFn: (parentType: string, childType: string) => boolean
  ): { targetNode: CanvasNode | null; worldCoords: WorldCoords; resourceType: string } | null => {
    e.preventDefault();

    const resourceType = e.dataTransfer.getData('resourceType');
    if (!resourceType) {
      return null;
    }

    const rect = this.canvas.getBoundingClientRect();
    const worldCoords = screenToWorld(
      e.clientX,
      e.clientY,
      rect,
      this.state.transform
    );

    const targetNode = this.hitTester.getNodeAtPoint(worldCoords, this.nodes);

    // Clear drop feedback
    this.config.onStateChange({
      ...this.state,
      dropTargetId: null,
    });

    // Validate and return drop info
    if (targetNode && targetNode.isContainer && canContainFn(targetNode.resourceType, resourceType)) {
      return { targetNode, worldCoords, resourceType };
    } else if (!targetNode) {
      // Dropped on empty canvas (create root resource)
      return { targetNode: null, worldCoords, resourceType };
    }

    return null;
  };
}
