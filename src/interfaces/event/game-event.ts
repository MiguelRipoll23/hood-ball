import { EventType } from "../../enums/event-type.js";

export interface GameEvent {
  getType(): EventType;
  getData(): unknown;
}
