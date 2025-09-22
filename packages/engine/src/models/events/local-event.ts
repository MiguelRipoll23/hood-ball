import type { EngineEventId } from "@engine/contracts/events/event-identifier.js";
import { BaseEvent } from "./base-event.js";

export class LocalEvent<
  TData = unknown,
  TEventId extends EngineEventId = EngineEventId
> extends BaseEvent<TData, TEventId> {}
