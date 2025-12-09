import { EventType } from "../../enums/event-type.js";

export interface GameEvent {
  getType(): EventType;
  isConsumed(): boolean;
  consume(): void;
  getData(): unknown;
  getConsumedAt(): number | null;
}
