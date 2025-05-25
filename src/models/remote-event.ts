import type { GameEvent } from "../interfaces/event/game-event.js";
import { EventType } from "../enums/event-type.js";

export class RemoteEvent implements GameEvent {
  private type: EventType;
  private arrayBuffer: ArrayBuffer | null = null;

  constructor(id: EventType) {
    this.type = id;
  }

  public getType(): EventType {
    return this.type;
  }

  public getArrayBuffer(): ArrayBuffer | null {
    return this.arrayBuffer;
  }

  public setArrayBuffer(buffer: ArrayBuffer | null): void {
    this.arrayBuffer = buffer;
  }
}
