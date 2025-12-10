/**
 * Hit testing utilities for determining which canvas element is at a given coordinate
 * Used for mouse interactions like click, hover, and drag-and-drop
 */

import { CanvasNode, WorldCoords, Rect, Point } from './types';

/**
 * Button region within a container node
 */
export interface ButtonRegion {
  nodeId: string;
  bounds: Rect;
  action: 'add-resource';
}

/**
 * HitTester class for coordinate-to-element mapping
 */
export class HitTester {
  /**
   * Find the topmost node at a given world coordinate
   * Checks children first (higher z-index) before parents
   */
  getNodeAtPoint(point: WorldCoords, nodes: CanvasNode[]): CanvasNode | null {
    // Sort by z-index descending (children first, then parents)
    const sortedNodes = [...nodes].sort((a, b) => b.zIndex - a.zIndex);

    for (const node of sortedNodes) {
      if (this.isPointInRect(point, node.bounds)) {
        return node;
      }
    }

    return null;
  }

  /**
   * Check if a point is inside a rectangular region
   */
  isPointInRect(point: Point, rect: Rect): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  /**
   * Check if a point is inside a circular region
   */
  isPointInCircle(point: Point, center: Point, radius: number): boolean {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return (dx * dx + dy * dy) <= (radius * radius);
  }

  /**
   * Get the "Add Resource" button region for a container node
   * Returns the bounds of the button in world coordinates
   */
  getAddResourceButtonBounds(node: CanvasNode): Rect | null {
    if (!node.isContainer) {
      return null;
    }

    const buttonWidth = 115;
    const buttonHeight = 32;
    const offset = 15;

    return {
      x: node.bounds.x + node.bounds.width - buttonWidth - offset,
      y: node.bounds.y + node.bounds.height - buttonHeight - offset,
      width: buttonWidth,
      height: buttonHeight,
    };
  }

  /**
   * Check if a point is within the "Add Resource" button of a container
   */
  isPointInAddResourceButton(point: WorldCoords, node: CanvasNode): boolean {
    if (!node.isContainer) {
      return false;
    }

    const buttonBounds = this.getAddResourceButtonBounds(node);
    if (!buttonBounds) {
      return false;
    }

    return this.isPointInRect(point, buttonBounds);
  }

  /**
   * Get all buttons in the scene
   * Useful for rendering or advanced hit testing
   */
  getAllButtons(nodes: CanvasNode[]): ButtonRegion[] {
    const buttons: ButtonRegion[] = [];

    for (const node of nodes) {
      if (node.isContainer) {
        const bounds = this.getAddResourceButtonBounds(node);
        if (bounds) {
          buttons.push({
            nodeId: node.id,
            bounds,
            action: 'add-resource',
          });
        }
      }
    }

    return buttons;
  }

  /**
   * Get the connection handle at a given point
   * Returns the node and handle type if found
   */
  getHandleAtPoint(
    point: WorldCoords,
    nodes: CanvasNode[],
    handleRadius: number = 6
  ): { node: CanvasNode; handle: 'source' | 'target' } | null {
    for (const node of nodes) {
      const sourcePos = this.getHandlePosition(node, 'source');
      const targetPos = this.getHandlePosition(node, 'target');

      if (this.isPointInCircle(point, sourcePos, handleRadius)) {
        return { node, handle: 'source' };
      }

      if (this.isPointInCircle(point, targetPos, handleRadius)) {
        return { node, handle: 'target' };
      }
    }

    return null;
  }

  /**
   * Get the world position of a handle on a node
   */
  getHandlePosition(node: CanvasNode, handle: 'source' | 'target'): Point {
    const { x, y, width, height } = node.bounds;

    // Child nodes have handles on top/bottom
    if (node.parentId) {
      return handle === 'source'
        ? { x: x + width / 2, y: y + height }     // Bottom center
        : { x: x + width / 2, y };                 // Top center
    }

    // Root nodes have handles on left/right
    return handle === 'source'
      ? { x: x + width, y: y + height / 2 }       // Right center
      : { x, y: y + height / 2 };                  // Left center
  }

  /**
   * Check if two rectangular regions overlap
   * Useful for collision detection
   */
  rectsOverlap(rect1: Rect, rect2: Rect): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  /**
   * Get all nodes within a rectangular selection area
   */
  getNodesInRect(selectionRect: Rect, nodes: CanvasNode[]): CanvasNode[] {
    return nodes.filter(node => this.rectsOverlap(selectionRect, node.bounds));
  }
}
