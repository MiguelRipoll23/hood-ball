import type { GameEvent } from "../interfaces/models/game-event.js";
import { EventType } from "@game/enums/event-type.js";
import { BaseEvent } from "./base-event.js";

export class LocalEvent<T = unknown> extends BaseEvent<T> implements GameEvent {
  constructor(id: EventType) {
    super(id);
  }
}
