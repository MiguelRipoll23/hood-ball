import type { EventType } from "../enums/event-type.js";
import type { GameEvent } from "../interfaces/events/game-event.js";

export class BaseEvent<T> implements GameEvent {
  private type: EventType;
  private consumed: boolean = false;
  private consumedAt: number | null = null;
  private data: T | null = null;

  constructor(id: EventType) {
    this.type = id;
  }

  public getType(): EventType {
    return this.type;
  }

  public isConsumed(): boolean {
    return this.consumed;
  }

  public consume(): void {
    this.consumed = true;
    this.consumedAt = Date.now();
  }

  public getConsumedAt(): number | null {
    return this.consumedAt;
  }

  public getData(): T | null {
    return this.data;
  }

  public setData(data: T): void {
    this.data = data;
  }
}
