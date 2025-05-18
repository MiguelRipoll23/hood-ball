import type { GameEvent } from "../interfaces/event/game-event.js";
import { EventType } from "../enums/event-type.js";

export class RemoteEvent implements GameEvent {
  private type: EventType;
  private buffer: ArrayBuffer | null = null;

  constructor(id: EventType) {
    this.type = id;
  }

  public getType(): EventType {
    return this.type;
  }

  public getData(): ArrayBuffer | null {
    return this.buffer;
  }

  public setBuffer(buffer: ArrayBuffer | null): void {
    this.buffer = buffer;
  }
}
