import { LayerType } from "../../enums/layer-type.js";

/**
 * Represents an entity spawn event during recording
 */
export interface EntitySpawnEvent {
  timestamp: number;
  id: string;
  type: number; // EntityType enum value (-1 if entity doesn't have a type)
  layer: LayerType; // UI or Scene layer
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  serializedData?: ArrayBuffer; // Entity-specific serialized data (if entity implements getReplayState())
}
