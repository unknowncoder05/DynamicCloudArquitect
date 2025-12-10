/**
 * EdgeRenderer class for drawing edges/connections between nodes
 * Handles dependency visualization with smooth orthogonal routing
 */

import { CanvasEdge, CanvasNode, Point, EdgeStyle } from './types';
import { HitTester } from './HitTester';

/**
 * EdgeRenderer renders edges (dependencies) between nodes
 */
export class EdgeRenderer {
  private ctx: CanvasRenderingContext2D;
  private hitTester: HitTester;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.hitTester = new HitTester();
  }

  /**
   * Draw an edge between two nodes
   */
  drawEdge(edge: CanvasEdge, nodes: CanvasNode[]): void {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      return;
    }

    // Get connection handle positions
    const start = this.hitTester.getHandlePosition(sourceNode, 'source');
    const end = this.hitTester.getHandlePosition(targetNode, 'target');

    // Determine edge style based on type
    const style: EdgeStyle = {
      color: edge.isExplicit ? '#f59e0b' : '#6b7280',
      width: 2,
      animated: edge.animated,
      label: edge.label,
    };

    // Draw the edge
    this.drawSmoothstepCurve(start, end, style);
  }

  /**
   * Draw a smoothstep (orthogonal) Bezier curve between two points
   * Creates an S-shaped curve that exits horizontally/vertically from handles
   */
  private drawSmoothstepCurve(start: Point, end: Point, style: EdgeStyle): void {
    this.ctx.save();

    // Calculate control points for orthogonal routing
    // The midpoint determines how far the curve extends before turning
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Control points create the smooth turn
    // For horizontal flow (left/right handles): control points extend horizontally then turn
    // For vertical flow (top/bottom handles): control points extend vertically then turn

    // Determine if this is horizontal or vertical based on handle positions
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const isHorizontal = dx > dy;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);

    if (isHorizontal) {
      // Horizontal flow: handles on left/right of nodes
      // Control points extend horizontally from start and end
      this.ctx.bezierCurveTo(
        midX, start.y,    // Control point 1: horizontal from start
        midX, end.y,      // Control point 2: vertical to end
        end.x, end.y      // End point
      );
    } else {
      // Vertical flow: handles on top/bottom of nodes
      // Control points extend vertically from start and end
      this.ctx.bezierCurveTo(
        start.x, midY,    // Control point 1: vertical from start
        end.x, midY,      // Control point 2: horizontal to end
        end.x, end.y      // End point
      );
    }

    // Apply stroke style
    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;

    // Animated edges: dashed line with moving offset
    if (style.animated) {
      const offset = (Date.now() / 20) % 20; // Animated dash offset
      this.ctx.setLineDash([8, 4]);
      this.ctx.lineDashOffset = -offset;
    } else {
      this.ctx.setLineDash([]);
    }

    this.ctx.stroke();

    // Draw label if present
    if (style.label) {
      this.drawEdgeLabel(style.label, midX, midY, style.color);
    }

    // Draw arrowhead at the target end
    this.drawArrowhead(start, end, style.color, isHorizontal);

    this.ctx.restore();
  }

  /**
   * Draw an arrowhead at the target end of an edge
   */
  private drawArrowhead(
    start: Point,
    end: Point,
    color: string,
    isHorizontal: boolean
  ): void {
    const arrowSize = 8;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    this.ctx.save();
    this.ctx.translate(end.x, end.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(-arrowSize, -arrowSize / 2);
    this.ctx.lineTo(-arrowSize, arrowSize / 2);
    this.ctx.closePath();

    this.ctx.fillStyle = color;
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * Draw a label on an edge
   */
  private drawEdgeLabel(
    label: string,
    x: number,
    y: number,
    color: string
  ): void {
    this.ctx.save();

    // Draw background for label
    this.ctx.font = '10px sans-serif';
    const metrics = this.ctx.measureText(label);
    const padding = 4;
    const boxWidth = metrics.width + padding * 2;
    const boxHeight = 16;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(
      x - boxWidth / 2,
      y - boxHeight / 2,
      boxWidth,
      boxHeight
    );

    // Draw border
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      x - boxWidth / 2,
      y - boxHeight / 2,
      boxWidth,
      boxHeight
    );

    // Draw text
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, x, y);

    this.ctx.restore();
  }

  /**
   * Draw all edges in the scene
   */
  drawEdges(edges: CanvasEdge[], nodes: CanvasNode[]): void {
    for (const edge of edges) {
      this.drawEdge(edge, nodes);
    }
  }
}
