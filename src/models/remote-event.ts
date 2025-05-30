import type { GameEvent } from "../interfaces/events/game-event.js";
import { EventType } from "../enums/event-type.js";
import { BaseEvent } from "./base-event.js";

export class RemoteEvent<T = ArrayBuffer>
  extends BaseEvent<T>
  implements GameEvent
{
  constructor(id: EventType) {
    super(id);
  }
}
