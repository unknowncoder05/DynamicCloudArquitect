/**
 * Canvas module exports
 * Provides all canvas rendering and interaction functionality
 */

// Core classes
export { CanvasRenderer } from './CanvasRenderer';
export { CanvasEventHandler } from './CanvasEventHandler';
export { NodeRenderer } from './NodeRenderer';
export { EdgeRenderer } from './EdgeRenderer';
export { HitTester } from './HitTester';

// Utility functions
export {
  screenToWorld,
  worldToScreen,
  clampZoom,
  zoomTowardsPoint,
  fitNodesToView,
  panTransform,
} from './CanvasViewport';

// Types
export type {
  Point,
  Rect,
  WorldCoords,
  ScreenCoords,
  Position,
  Transform,
  CanvasNode,
  CanvasEdge,
  DragState,
  PanState,
  CanvasState,
  NodeRenderState,
  TextStyle,
  EdgeStyle,
  ContainerConfig,
  ResourceConfig,
} from './types';
