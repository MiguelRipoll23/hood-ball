import { GameEvent } from "../interfaces/event/game-event.js";

export class EventQueue<T extends GameEvent> {
  protected events: T[] = [];

  public getEvents(): T[] {
    return this.events;
  }

  public addEvent(event: T) {
    this.events.push(event);
  }

  public removeEvent(event: T) {
    const index = this.events.indexOf(event);

    if (index > -1) {
      this.events.splice(index, 1);
    }
  }
}
