/**
 * Canvas-specific types for the TerraformDiagram
 * Defines data structures for rendering infrastructure diagrams using HTML5 Canvas
 */

import { ResourceStatus } from '../../../types/terraform';

/**
 * 2D point in space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle bounds
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * World coordinates - the infinite virtual coordinate space where nodes live
 */
export type WorldCoords = Point;

/**
 * Screen coordinates - browser viewport coordinates (0,0 = top-left of screen)
 */
export type ScreenCoords = Point;

/**
 * Handle position for edges/connections
 */
export type Position = 'top' | 'bottom' | 'left' | 'right';

/**
 * Transform state for pan and zoom
 */
export interface Transform {
  x: number;      // Pan offset X in pixels
  y: number;      // Pan offset Y in pixels
  zoom: number;   // Zoom scale (0.1 to 3.0)
}

/**
 * Canvas node representing a Terraform resource
 * This is the canvas-specific version of a node with position and rendering info
 */
export interface CanvasNode {
  id: string;
  label: string;
  resourceType: string;
  status: ResourceStatus;
  configuration: Record<string, any>;
  isContainer: boolean;
  containedCount: number;
  parentId?: string;
  bounds: Rect;
  zIndex: number;
  handles: {
    source: Position;
    target: Position;
  };
}

/**
 * Canvas edge representing a dependency between resources
 */
export interface CanvasEdge {
  id: string;
  source: string;      // Source node ID
  target: string;      // Target node ID
  isExplicit: boolean; // Explicit dependency (depends_on) vs implicit
  animated: boolean;   // Animate the edge (dashed line moving)
  label?: string;      // Optional label (e.g., "depends_on")
}

/**
 * Drag state when dragging a node
 */
export interface DragState {
  nodeId: string;
  startPos: WorldCoords;
  offset: Point; // Offset from node top-left to cursor
}

/**
 * Pan state when panning the canvas
 */
export interface PanState {
  startPos: ScreenCoords;
  startTransform: Transform;
}

/**
 * Complete canvas interaction state
 */
export interface CanvasState {
  transform: Transform;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  dragState: DragState | null;
  panState: PanState | null;
  dropTargetId: string | null;
}

/**
 * Node rendering state (visual feedback)
 */
export interface NodeRenderState {
  isSelected: boolean;
  isHovered: boolean;
  isDropTarget: boolean;
  canDrop: boolean;
}

/**
 * Text rendering style
 */
export interface TextStyle {
  fontSize: number;
  fontWeight?: number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
}

/**
 * Edge rendering style
 */
export interface EdgeStyle {
  color: string;
  width: number;
  animated: boolean;
  label?: string;
}

/**
 * Container visual configuration
 */
export interface ContainerConfig {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle?: 'solid' | 'dashed';
  minWidth: number;
  minHeight: number;
  icon: string;
  displayName: string;
}

/**
 * Resource visual configuration
 */
export interface ResourceConfig {
  headerColor: string;
  borderColor: string;
  icon: string;
  displayName: string;
}
