/**
 * Represents a change in entity transform (position, rotation, scale)
 * Only changed properties are included
 */
export interface EntityTransformDelta {
  timestamp: number;
  id: string;
  x?: number;
  y?: number;
  angle?: number;
  velocityX?: number;
  velocityY?: number;
}
