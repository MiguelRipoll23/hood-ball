import { AnimationLogService } from "../services/debug/animation-log-service.js";
import { CameraService } from "../services/render/camera-service.js";
import { EventConsumerService } from "../services/events/event-consumer-service.js";
import { EventProcessorService } from "../services/events/event-processor-service.js";
import { IntervalManagerService } from "../services/time/interval-manager-service.js";
import { SceneManagerService } from "../services/scene/scene-manager-service.js";
import { SceneTransitionService } from "../services/scene/scene-transition-service.js";
import { TimerManagerService } from "../services/time/timer-manager-service.js";
import { EngineLoopService } from "../loop/engine-loop-service.js";

type ClassProvider = {
  provide: unknown;
  useClass: new (...args: never[]) => unknown;
};

type ValueProvider = {
  provide: unknown;
  useValue: unknown;
};

export type BindableContainer = {
  bind: (provider: ClassProvider | ValueProvider) => unknown;
};

/**
 * Registers engine-scoped services on the provided container.  Game-specific bindings should
 * live in a separate registration module to avoid reintroducing the core  game dependency cycle.
 */
export function registerEngineServices(container: BindableContainer): void {
  container.bind({ provide: EngineLoopService, useClass: EngineLoopService });
  container.bind({ provide: EventProcessorService, useClass: EventProcessorService });
  container.bind({ provide: EventConsumerService, useClass: EventConsumerService });
  container.bind({ provide: AnimationLogService, useClass: AnimationLogService });
  container.bind({ provide: CameraService, useClass: CameraService });
  container.bind({ provide: SceneTransitionService, useClass: SceneTransitionService });
  container.bind({ provide: SceneManagerService, useClass: SceneManagerService });
  container.bind({ provide: TimerManagerService, useClass: TimerManagerService });
  container.bind({ provide: IntervalManagerService, useClass: IntervalManagerService });
}
