import { GameEvent } from "../interfaces/event/game-event.js";
import { EventType } from "../enums/event-type.js";

export class LocalEvent<T = unknown> implements GameEvent {
  private id: EventType;
  private data: T;

  constructor(id: EventType, data: T) {
    this.id = id;
    this.data = data;
  }

  public getId(): EventType {
    return this.id;
  }

  public getPayload(): T {
    return this.data;
  }
}
