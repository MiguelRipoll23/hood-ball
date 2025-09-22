import type { EngineEventId } from "@engine/contracts/events/event-identifier.js";

export interface EngineEvent<
  TEventId extends EngineEventId = EngineEventId,
  TData = unknown
> {
  getType(): TEventId;
  isConsumed(): boolean;
  consume(): void;
  getData(): TData | null;
  getConsumedAt(): number | null;
}
