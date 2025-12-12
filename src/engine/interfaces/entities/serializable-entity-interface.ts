/**
 * Interface for entities that can serialize and deserialize their state for recordings
 */
export interface SerializableEntity {
  /**
   * Serialize the entity's state to a generic object
   * This should include all properties needed to recreate the entity's visual state
   */
  serializeForRecording(): Record<string, unknown>;

  /**
   * Deserialize and apply state from a generic object
   * This should restore the entity's visual state from recorded data
   */
  deserializeFromRecording(data: Record<string, unknown>): void;
}

/**
 * Check if an entity implements the SerializableEntity interface
 */
export function isSerializableEntity(entity: unknown): entity is SerializableEntity {
  return (
    typeof entity === "object" &&
    entity !== null &&
    "serializeForRecording" in entity &&
    typeof (entity as SerializableEntity).serializeForRecording === "function" &&
    "deserializeFromRecording" in entity &&
    typeof (entity as SerializableEntity).deserializeFromRecording === "function"
  );
}
