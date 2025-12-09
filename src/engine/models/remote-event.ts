import type { GameEvent } from "../interfaces/models/game-event-interface.ts";
import { EventType } from "../enums/event-type.ts";
import { BaseEvent } from "./base-event.ts";

export class RemoteEvent<T = ArrayBuffer>
  extends BaseEvent<T>
  implements GameEvent
{
  constructor(id: EventType) {
    super(id);
  }
}
