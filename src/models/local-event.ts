import type { GameEvent } from "../interfaces/event/game-event.js";
import { EventType } from "../enums/event-type.js";

export class LocalEvent<T = unknown> implements GameEvent {
  private type: EventType;
  private data: T;

  constructor(id: EventType, data: T) {
    this.type = id;
    this.data = data;
  }

  public getType(): EventType {
    return this.type;
  }

  public getData(): T {
    return this.data;
  }
}
