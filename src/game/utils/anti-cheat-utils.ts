import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { AntiCheatRule } from "../models/anti-cheat-rule.js";
import type { AntiCheatRuleField } from "../models/anti-cheat-rule.js";
import { AntiCheatRuleType } from "../enums/anti-cheat-rule-type.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A detected rule violation, ready to be reported. */
export interface RuleViolation {
  ruleId: number;
  /** Human-readable description including unexpected values. */
  reason: string;
  /** Optional network ID of the specific player who violated the rule. */
  targetUserId?: string;
}

/** Position sample for movement tracking. */
export interface MovementSample {
  x: number;
  y: number;
  timestamp: number;
}

/** Minimal data needed from a scene entity for movement tracking. */
export interface TrackedEntity {
  id: string;
  x: number;
  y: number;
  ownerId: string;
  typeId: number;
}

// ---------------------------------------------------------------------------
// Binary parsing / serialization
// ---------------------------------------------------------------------------

const FIELD_VALUE_UINT16 = 0x00;
const FIELD_VALUE_FLOAT32 = 0x01;

/** Parse a list of anti-cheat rules from a binary ArrayBuffer. */
export function parseAntiCheatRules(buffer: ArrayBuffer): AntiCheatRule[] {
  const reader = BinaryReader.fromArrayBuffer(buffer);
  const ruleCount = reader.unsignedInt16();
  const rules: AntiCheatRule[] = [];

  for (let i = 0; i < ruleCount; i++) {
    rules.push(parseSingleRule(reader));
  }

  return rules;
}

/** Serialize a list of anti-cheat rules into a binary ArrayBuffer. */
export function serializeAntiCheatRules(
  rules: readonly AntiCheatRule[],
): ArrayBuffer {
  const writer = BinaryWriter.build();
  writer.unsignedInt16(rules.length);

  for (const rule of rules) {
    writer.unsignedInt16(rule.ruleId);
    writer.unsignedInt8(rule.ruleType);
    writer.unsignedInt8(rule.fields.length);

    for (const field of rule.fields) {
      writer.unsignedInt8(field.fieldId);
      writer.unsignedInt8(field.valueType);

      if (field.valueType === FIELD_VALUE_UINT16) {
        writer.unsignedInt16(field.value);
      } else {
        writer.float32(field.value);
      }
    }
  }

  return writer.toArrayBuffer();
}

function parseSingleRule(reader: BinaryReader): AntiCheatRule {
  const ruleId = reader.unsignedInt16();
  const ruleType = reader.unsignedInt8();
  const fieldCount = reader.unsignedInt8();

  const fields: AntiCheatRuleField[] = [];

  for (let i = 0; i < fieldCount; i++) {
    const fieldId = reader.unsignedInt8();
    const valueType = reader.unsignedInt8();

    let value: number;
    if (valueType === FIELD_VALUE_UINT16) {
      value = reader.unsignedInt16();
    } else if (valueType === FIELD_VALUE_FLOAT32) {
      value = reader.float32();
    } else {
      reader.float32(); // skip 4 bytes to stay aligned
      console.warn(
        `[AntiCheat] Unknown field value type 0x${valueType.toString(16)} for rule ${ruleId}, field ${fieldId}`,
      );
      continue;
    }

    fields.push({ fieldId, valueType, value });
  }

  return new AntiCheatRule(ruleId, ruleType, fields);
}

// ---------------------------------------------------------------------------
// Rule evaluation
// ---------------------------------------------------------------------------

export function evaluateEventRateRules(
  rules: readonly AntiCheatRule[],
  eventType: number,
  timestamps: readonly number[],
  now: number,
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    if (rule.ruleType !== AntiCheatRuleType.EventRateLimit) {
      continue;
    }

    const targetEventType = rule.getFieldOrDefault(0, -1);
    if (targetEventType !== eventType) {
      continue;
    }

    const maxCount = rule.getFieldOrDefault(1, Infinity);
    const windowSeconds = rule.getFieldOrDefault(2, 60);
    const windowMs = windowSeconds * 1000;
    const cutoff = now - windowMs;

    let count = 0;
    for (const ts of timestamps) {
      if (ts >= cutoff) {
        count++;
      }
    }

    if (count > maxCount) {
      violations.push({
        ruleId: rule.ruleId,
        reason: `EventRateLimit exceeded: eventType=${eventType}, count=${count}, max=${maxCount}, window=${windowSeconds}s`,
      });
    }
  }

  return violations;
}

export function evaluateMovementRules(
  rules: readonly AntiCheatRule[],
  ownerId: string,
  entityTypeId: number,
  samples: readonly MovementSample[],
  now: number,
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    if (rule.ruleType !== AntiCheatRuleType.MovementSpeedLimit) {
      continue;
    }

    // Optional entity-type filter (fieldId=2). 0 or absent = all types.
    const ruleEntityTypeId = rule.getFieldOrDefault(2, 0);
    if (ruleEntityTypeId !== 0 && ruleEntityTypeId !== entityTypeId) {
      continue;
    }

    const maxDistance = rule.getFieldOrDefault(0, Infinity);
    const windowSeconds = rule.getFieldOrDefault(1, 60);
    const windowMs = windowSeconds * 1000;
    const cutoff = now - windowMs;

    let cumulativeDistance = 0;
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];

      if (curr.timestamp < cutoff) {
        continue;
      }

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      cumulativeDistance += Math.sqrt(dx * dx + dy * dy);
    }

    if (cumulativeDistance > maxDistance) {
      violations.push({
        ruleId: rule.ruleId,
        reason: `MovementSpeedLimit exceeded: entityType=${entityTypeId}, distance=${cumulativeDistance.toFixed(2)}, max=${maxDistance}, window=${windowSeconds}s`,
        targetUserId: ownerId,
      });
    }
  }

  return violations;
}
