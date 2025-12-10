/**
 * CanvasRenderer - Main rendering orchestrator
 * Coordinates node and edge rendering, manages render pipeline
 */

import { CanvasNode, CanvasEdge, CanvasState, Transform } from './types';
import { NodeRenderer } from './NodeRenderer';
import { EdgeRenderer } from './EdgeRenderer';

/**
 * CanvasRenderer is the main rendering engine
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodeRenderer: NodeRenderer;
  private edgeRenderer: EdgeRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    this.ctx = ctx;
    this.nodeRenderer = new NodeRenderer(ctx);
    this.edgeRenderer = new EdgeRenderer(ctx);
  }

  /**
   * Main render method - renders the entire scene
   */
  render(
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    state: CanvasState
  ): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    this.ctx.save();

    // Apply transform (pan and zoom)
    this.ctx.translate(state.transform.x, state.transform.y);
    this.ctx.scale(state.transform.zoom, state.transform.zoom);

    // Draw grid background (in world space)
    this.drawGrid(state.transform);

    // Sort nodes by z-index (containers first, children on top)
    const sortedNodes = [...nodes].sort((a, b) => a.zIndex - b.zIndex);

    // Draw edges first (behind nodes)
    this.edgeRenderer.drawEdges(edges, nodes);

    // Draw nodes
    sortedNodes.forEach(node => {
      const renderState = {
        isSelected: node.id === state.selectedNodeId,
        isHovered: node.id === state.hoveredNodeId,
        isDropTarget: node.id === state.dropTargetId,
        canDrop: this.canDropOnNode(node, state),
      };

      this.nodeRenderer.drawNode(node, renderState);
    });

    // Draw selection highlight (additional visual feedback)
    if (state.selectedNodeId) {
      const selectedNode = nodes.find(n => n.id === state.selectedNodeId);
      if (selectedNode) {
        this.drawSelectionBox(selectedNode);
      }
    }

    // Restore context state
    this.ctx.restore();
  }

  /**
   * Draw infinite grid background
   * Grid extends infinitely and moves with the transform
   */
  private drawGrid(transform: Transform): void {
    const gridSize = 16;
    const { width, height } = this.canvas;

    this.ctx.save();
    this.ctx.strokeStyle = '#e5e7eb'; // Lighter gray (Tailwind gray-200)
    this.ctx.lineWidth = 0.5 / transform.zoom; // Adjust line width for zoom

    // Calculate visible world area (inverse of transform)
    // Convert screen bounds to world coordinates
    const worldLeft = -transform.x / transform.zoom;
    const worldTop = -transform.y / transform.zoom;
    const worldRight = (width - transform.x) / transform.zoom;
    const worldBottom = (height - transform.y) / transform.zoom;

    // Extend grid beyond visible area for smooth panning
    const padding = 500;
    const startX = Math.floor((worldLeft - padding) / gridSize) * gridSize;
    const endX = Math.ceil((worldRight + padding) / gridSize) * gridSize;
    const startY = Math.floor((worldTop - padding) / gridSize) * gridSize;
    const endY = Math.ceil((worldBottom + padding) / gridSize) * gridSize;

    // Draw vertical lines
    for (let x = startX; x < endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Draw selection highlight box around selected node
   */
  private drawSelectionBox(node: CanvasNode): void {
    const { x, y, width, height } = node.bounds;
    const padding = 4;

    this.ctx.save();
    this.ctx.strokeStyle = '#1976d2';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);

    this.ctx.strokeRect(
      x - padding,
      y - padding,
      width + padding * 2,
      height + padding * 2
    );

    this.ctx.restore();
  }

  /**
   * Check if a resource can be dropped on a node
   * This would typically check CONTAINER_RULES
   */
  private canDropOnNode(node: CanvasNode, state: CanvasState): boolean {
    // This logic will be implemented when we integrate with the main component
    // For now, just return true for containers
    return node.isContainer;
  }

  /**
   * Update canvas size
   */
  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get rendering context
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
