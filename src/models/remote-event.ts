import { GameEvent } from "../interfaces/event/game-event.js";
import { EventType } from "../enums/event-type.js";

export class RemoteEvent implements GameEvent {
  private id: EventType;
  private buffer: ArrayBuffer | null = null;

  constructor(id: EventType) {
    this.id = id;
  }

  public getId(): EventType {
    return this.id;
  }

  public getBuffer(): ArrayBuffer | null {
    return this.buffer;
  }

  public setBuffer(buffer: ArrayBuffer | null): void {
    this.buffer = buffer;
  }
}
