import { LayerType } from "../../enums/layer-type.js";

/**
 * Represents a complete snapshot of an entity's state
 * Used for initial state capture and as reference points
 */
export interface EntitySnapshot {
  id: string;
  type: number; // EntityType enum value (-1 if entity doesn't have a type)
  layer: LayerType; // UI or Scene layer
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  visible: boolean;
  opacity: number;
  velocityX?: number;
  velocityY?: number;
  // Serialized data from entity's getReplayState() method (if entity implements it)
  serializedData?: ArrayBuffer;
}
