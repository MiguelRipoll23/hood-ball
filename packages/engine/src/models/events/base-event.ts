import type { EngineEventId } from "@engine/contracts/events/event-identifier.js";
import type { EngineEvent } from "../engine-event.js";

export class BaseEvent<
  TData = unknown,
  TEventId extends EngineEventId = EngineEventId
> implements EngineEvent<TEventId, TData> {
  private type: TEventId;
  private consumed = false;
  private consumedAt: number | null = null;
  private data: TData | null = null;

  constructor(id: TEventId) {
    this.type = id;
  }

  public getType(): TEventId {
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

  public getData(): TData | null {
    return this.data;
  }

  public setData(data: TData): void {
    this.data = data;
  }
}
