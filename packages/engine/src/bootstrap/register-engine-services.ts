import { AnimationLogService } from "../services/debug/animation-log-service.js";
import { CameraService } from "../services/render/camera-service.js";
import { EventConsumerService } from "../services/events/event-consumer-service.js";
import { EventProcessorService } from "../services/events/event-processor-service.js";
import { IntervalManagerService } from "../services/time/interval-manager-service.js";
import { SceneManagerService } from "../services/scene/scene-manager-service.js";
import { SceneTransitionService } from "../services/scene/scene-transition-service.js";
import { TimerManagerService } from "../services/time/timer-manager-service.js";
import { EngineLoopService } from "../loop/engine-loop-service.js";
import { EventQueueService } from "../services/events/event-queue-service.js";
import {
  LOCAL_EVENT_QUEUE_TOKEN,
  REMOTE_EVENT_QUEUE_TOKEN,
} from "../services/events/event-queue-tokens.js";
import {
  EVENT_IDENTIFIER_RESOLVER_TOKEN,
  type EventIdentifierResolver,
} from "../contracts/events/event-identifier.js";
import type { EventQueueServiceContract } from "../contracts/gameplay/event-queue-service-interface.js";
import { LocalEvent } from "@engine/models/events/local-event.js";
import { RemoteEvent } from "@engine/models/events/remote-event.js";

type ContainerContract = {
  get: <T>(token: unknown) => T;
  has?: (token: unknown) => boolean;
};

type ClassProvider = {
  provide: unknown;
  useClass: new (...args: never[]) => unknown;
};

type ValueProvider = {
  provide: unknown;
  useValue: unknown;
};

type FactoryProvider = {
  provide: unknown;
  useFactory: (container: ContainerContract) => unknown;
};

export type BindableContainer = {
  bind: (provider: ClassProvider | ValueProvider | FactoryProvider) => unknown;
};

/**
 * Registers engine-scoped services on the provided container.  Game-specific bindings should
 * live in a separate registration module to avoid reintroducing the core  game dependency cycle.
 */
export function registerEngineServices(container: BindableContainer): void {
  const localEventQueue = new EventQueueService();
  const remoteEventQueue = new EventQueueService();

  container.bind({ provide: EngineLoopService, useClass: EngineLoopService });
  container.bind({ provide: LOCAL_EVENT_QUEUE_TOKEN, useValue: localEventQueue });
  container.bind({ provide: REMOTE_EVENT_QUEUE_TOKEN, useValue: remoteEventQueue });
  container.bind({
    provide: EventProcessorService,
    useFactory: (target) => {
      const resolver = (target.has?.(EVENT_IDENTIFIER_RESOLVER_TOKEN) ?? false)
        ? (target.get(EVENT_IDENTIFIER_RESOLVER_TOKEN) as EventIdentifierResolver)
        : null;
      const localQueue = target.get(LOCAL_EVENT_QUEUE_TOKEN) as EventQueueServiceContract<LocalEvent>;
      const remoteQueue = target.get(REMOTE_EVENT_QUEUE_TOKEN) as EventQueueServiceContract<RemoteEvent>;
      return new EventProcessorService(
        localQueue,
        remoteQueue,
        resolver
      );
    },
  });
  container.bind({
    provide: EventConsumerService,
    useFactory: (target) => {
      const resolver = (target.has?.(EVENT_IDENTIFIER_RESOLVER_TOKEN) ?? false)
        ? (target.get(EVENT_IDENTIFIER_RESOLVER_TOKEN) as EventIdentifierResolver)
        : null;
      const localQueue = target.get(LOCAL_EVENT_QUEUE_TOKEN) as EventQueueServiceContract<LocalEvent>;
      const remoteQueue = target.get(REMOTE_EVENT_QUEUE_TOKEN) as EventQueueServiceContract<RemoteEvent>;
      return new EventConsumerService(
        localQueue,
        remoteQueue,
        resolver
      );
    },
  });
  container.bind({ provide: AnimationLogService, useClass: AnimationLogService });
  container.bind({ provide: CameraService, useClass: CameraService });
  container.bind({ provide: SceneTransitionService, useClass: SceneTransitionService });
  container.bind({ provide: SceneManagerService, useClass: SceneManagerService });
  container.bind({ provide: TimerManagerService, useClass: TimerManagerService });
  container.bind({ provide: IntervalManagerService, useClass: IntervalManagerService });
}
