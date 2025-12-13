/**
 * Represents a change in entity gameplay state
 * Contains serialized data from entity's serialize() method
 */
export interface EntityStateDelta {
  timestamp: number;
  id: string;
  serializedData: ArrayBuffer; // Entity-specific serialized data from serialize() method
}
