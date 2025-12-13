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
  // Serialized data from entity's serialize() method (if entity implements it)
  serializedData?: ArrayBuffer;
}
