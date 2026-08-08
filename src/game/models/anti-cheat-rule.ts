/**
 * A field within an anti-cheat rule, holding a typed value.
 */
export interface AntiCheatRuleField {
  /** Parameter identifier (meaning depends on rule type). */
  fieldId: number;
  /** 0x00 = uint16, 0x01 = float32 */
  valueType: number;
  /** The parsed numeric value. */
  value: number;
}

/**
 * AntiCheatRule — Parsed representation of an anti-cheat rule.
 *
 * Each rule has a unique identifier, a type category, and a set of typed
 * fields.  Rule type comparisons should use the {@link AntiCheatRuleType}
 * constants.
 */
export class AntiCheatRule {
  public constructor(
    /** Unique rule identifier. */
    public readonly ruleId: number,
    /** Category of the rule (use AntiCheatRuleType for comparison). */
    public readonly ruleType: number,
    /** Typed fields that parameterize the rule. */
    public readonly fields: readonly AntiCheatRuleField[],
  ) {}

  /**
   * Get a field value by fieldId, or null if not found.
   */
  public getField(fieldId: number): number | null {
    for (const field of this.fields) {
      if (field.fieldId === fieldId) {
        return field.value;
      }
    }
    return null;
  }

  /**
   * Get a field value by fieldId, returning defaultValue if not found.
   */
  public getFieldOrDefault(fieldId: number, defaultValue: number): number {
    return this.getField(fieldId) ?? defaultValue;
  }
}
