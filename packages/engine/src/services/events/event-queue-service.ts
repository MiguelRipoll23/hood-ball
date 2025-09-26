import type { EngineEvent } from "@engine/models/engine-event.js";

export type EventQueueOptions = {
  /** Maximum number of events the queue will retain before trimming. */
  maxPendingEvents?: number;
  /** Number of consumed events required before a compaction pass is triggered. */
  compactionThreshold?: number;
};

export class EventQueueService<T extends EngineEvent = EngineEvent> {
  private readonly maxPendingEvents: number;
  private readonly compactionThreshold: number;
  private consumedSinceCompaction = 0;

  protected events: T[] = [];

  constructor(options: EventQueueOptions = {}) {
    this.maxPendingEvents = Math.max(32, options.maxPendingEvents ?? 512);
    this.compactionThreshold = Math.max(1, options.compactionThreshold ?? Math.floor(this.maxPendingEvents / 4));
  }

  public getEvents(): T[] {
    return this.events;
  }

  public getPendingEvents(): T[] {
    return this.events.filter((event) => !event.isConsumed());
  }

  public addEvent(event: T): void {
    this.events.push(event);

    if (this.events.length > this.maxPendingEvents) {
      this.compactQueue(true);
    }
  }

  public consumeEvent(event: T): void {
    const foundEvent = this.events.find((candidate) => candidate === event);

    if (foundEvent === undefined || foundEvent.isConsumed()) {
      return;
    }

    foundEvent.consume();
    this.consumedSinceCompaction += 1;

    if (this.consumedSinceCompaction >= this.compactionThreshold) {
      this.compactQueue();
    }
  }

  private compactQueue(force = false): void {
    if (!force && this.consumedSinceCompaction < this.compactionThreshold) {
      return;
    }

    if (this.events.length === 0) {
      this.consumedSinceCompaction = 0;
      return;
    }

    if (this.consumedSinceCompaction > 0) {
      let consumedRemoved = 0;
      this.events = this.events.filter((event) => {
        if (event.isConsumed()) {
          consumedRemoved += 1;
          return false;
        }
        return true;
      });
      this.consumedSinceCompaction = Math.max(0, this.consumedSinceCompaction - consumedRemoved);
    }

    if (this.events.length > this.maxPendingEvents) {
      const overflow = this.events.length - this.maxPendingEvents;
      this.events.splice(0, overflow);
    }
  }
}


