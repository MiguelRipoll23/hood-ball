/**
 * Represents an entity spawn event during recording
 */
export interface EntitySpawnEvent {
  timestamp: number;
  id: string;
  type: string; // Entity type/prefab name
  x: number;
  y: number;
  angle?: number;
  properties: Record<string, unknown>;
}
