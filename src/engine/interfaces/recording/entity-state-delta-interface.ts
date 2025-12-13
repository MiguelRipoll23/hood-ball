/**
 * Represents a change in entity gameplay state
 * Only changed properties are included
 */
export interface EntityStateDelta {
  timestamp: number;
  id: string;
  properties: Record<string, unknown>;
}
