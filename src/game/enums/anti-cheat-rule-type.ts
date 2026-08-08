/**
 * AntiCheatRuleType — Identifies the category of an anti-cheat rule.
 *
 * Each rule type defines what parameters are expected in the binary payload.
 *
 * ## Rule Types
 *
 * ### EventRateLimit (0x00)
 * Tracks how many events of a given type a player fires per time window.
 * Fields:
 *   - fieldId=0, valueType=uint16 (0x00): eventTypeId
 *   - fieldId=1, valueType=float32 (0x01): maxCount
 *   - fieldId=2, valueType=float32 (0x01): windowSeconds
 *
 * ### MovementSpeedLimit (0x01)
 * Tracks how far a scene entity moves within a time window.
 * Fields:
 *   - fieldId=0, valueType=float32 (0x01): maxDistance
 *   - fieldId=1, valueType=float32 (0x01): windowSeconds
 *   - fieldId=2, valueType=uint16  (0x00): entityTypeId (optional, 0 = all types)
 */
export const AntiCheatRuleType = {
  EventRateLimit: 0x00,
  MovementSpeedLimit: 0x01,
} as const;

export type AntiCheatRuleType =
  (typeof AntiCheatRuleType)[keyof typeof AntiCheatRuleType];
