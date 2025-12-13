/**
 * Represents a complete snapshot of an entity's state
 * Used for initial state capture and as reference points
 */
export interface EntitySnapshot {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  visible: boolean;
  opacity: number;
  velocityX?: number;
  velocityY?: number;
  properties: Record<string, unknown>;
}
