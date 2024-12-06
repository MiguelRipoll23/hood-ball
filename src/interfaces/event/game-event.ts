import { EventType } from "../../enums/event-type.js";

export interface GameEvent {
  getId(): EventType;
}
