import type { LocalEvent } from "../../models/local-event.js";
import type { RemoteEvent } from "../../models/remote-event.js";
import type { EventQueueService } from "../../services/event-queue-service.js";

export interface IEventProcessorService {
  initialize(): void;
  getLocalQueue(): EventQueueService<LocalEvent>;
  getRemoteQueue(): EventQueueService<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  sendEvent(event: RemoteEvent): void;
}
