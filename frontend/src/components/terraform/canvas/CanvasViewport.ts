/**
 * Viewport utilities for coordinate transformations
 * Handles conversion between screen space (browser viewport) and world space (canvas coordinates)
 */

import { Transform, WorldCoords, ScreenCoords, Point } from './types';

/**
 * Convert screen coordinates to world coordinates
 * Screen coords = browser viewport (0,0 = top-left of screen)
 * World coords = canvas virtual space (nodes positioned here)
 *
 * @param screenX - X coordinate relative to viewport
 * @param screenY - Y coordinate relative to viewport
 * @param canvasRect - Canvas element bounding rect (for offset)
 * @param transform - Current pan/zoom transform
 * @returns World coordinates
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  canvasRect: DOMRect,
  transform: Transform
): WorldCoords {
  // Subtract canvas offset to get coordinates relative to canvas element
  const canvasX = screenX - canvasRect.left;
  const canvasY = screenY - canvasRect.top;

  // Reverse the transform: (canvas - pan) / zoom = world
  return {
    x: (canvasX - transform.x) / transform.zoom,
    y: (canvasY - transform.y) / transform.zoom,
  };
}

/**
 * Convert world coordinates to screen coordinates
 *
 * @param worldX - X coordinate in world space
 * @param worldY - Y coordinate in world space
 * @param canvasRect - Canvas element bounding rect (for offset)
 * @param transform - Current pan/zoom transform
 * @returns Screen coordinates
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  canvasRect: DOMRect,
  transform: Transform
): ScreenCoords {
  // Apply transform: world * zoom + pan = canvas
  const canvasX = worldX * transform.zoom + transform.x;
  const canvasY = worldY * transform.zoom + transform.y;

  // Add canvas offset to get screen coordinates
  return {
    x: canvasX + canvasRect.left,
    y: canvasY + canvasRect.top,
  };
}

/**
 * Clamp zoom level to valid range
 *
 * @param zoom - Raw zoom value
 * @param minZoom - Minimum zoom level (default: 0.1)
 * @param maxZoom - Maximum zoom level (default: 3.0)
 * @returns Clamped zoom value
 */
export function clampZoom(
  zoom: number,
  minZoom: number = 0.1,
  maxZoom: number = 3.0
): number {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * Calculate zoom transform that zooms towards a specific point
 * This keeps the point under the cursor stationary while zooming
 *
 * @param currentTransform - Current transform state
 * @param zoomDelta - Change in zoom (positive = zoom in, negative = zoom out)
 * @param pivotScreen - Screen coordinates of zoom pivot point (usually mouse cursor)
 * @param canvasRect - Canvas element bounding rect
 * @returns New transform with adjusted pan to maintain pivot point
 */
export function zoomTowardsPoint(
  currentTransform: Transform,
  zoomDelta: number,
  pivotScreen: Point,
  canvasRect: DOMRect
): Transform {
  const oldZoom = currentTransform.zoom;
  const newZoom = clampZoom(oldZoom + zoomDelta);

  // If zoom didn't actually change (hit min/max), return unchanged
  if (newZoom === oldZoom) {
    return currentTransform;
  }

  // Get pivot point relative to canvas element
  const pivotCanvas = {
    x: pivotScreen.x - canvasRect.left,
    y: pivotScreen.y - canvasRect.top,
  };

  // Calculate world position of pivot point before zoom
  const worldPivot = {
    x: (pivotCanvas.x - currentTransform.x) / oldZoom,
    y: (pivotCanvas.y - currentTransform.y) / oldZoom,
  };

  // Calculate new pan so that worldPivot maps back to pivotCanvas after zoom
  // pivotCanvas = worldPivot * newZoom + newPan
  // newPan = pivotCanvas - worldPivot * newZoom
  const newPan = {
    x: pivotCanvas.x - worldPivot.x * newZoom,
    y: pivotCanvas.y - worldPivot.y * newZoom,
  };

  return {
    x: newPan.x,
    y: newPan.y,
    zoom: newZoom,
  };
}

/**
 * Calculate transform to fit all nodes in viewport
 *
 * @param nodes - All canvas nodes
 * @param viewportWidth - Width of viewport in pixels
 * @param viewportHeight - Height of viewport in pixels
 * @param padding - Padding around nodes in pixels (default: 50)
 * @returns Transform that fits all nodes
 */
export function fitNodesToView(
  nodes: { x: number; y: number; width: number; height: number }[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): Transform {
  if (nodes.length === 0) {
    return { x: 0, y: 0, zoom: 1 };
  }

  // Calculate bounding box of all nodes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Calculate zoom to fit content with padding
  const zoomX = (viewportWidth - padding * 2) / contentWidth;
  const zoomY = (viewportHeight - padding * 2) / contentHeight;
  const zoom = clampZoom(Math.min(zoomX, zoomY));

  // Center content in viewport
  const scaledWidth = contentWidth * zoom;
  const scaledHeight = contentHeight * zoom;

  const x = (viewportWidth - scaledWidth) / 2 - minX * zoom;
  const y = (viewportHeight - scaledHeight) / 2 - minY * zoom;

  return { x, y, zoom };
}

/**
 * Pan transform by delta in screen space
 *
 * @param transform - Current transform
 * @param deltaX - Pan delta X in pixels
 * @param deltaY - Pan delta Y in pixels
 * @returns New transform with updated pan
 */
export function panTransform(
  transform: Transform,
  deltaX: number,
  deltaY: number
): Transform {
  return {
    ...transform,
    x: transform.x + deltaX,
    y: transform.y + deltaY,
  };
}
