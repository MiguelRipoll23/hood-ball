import { GameState } from "../models/game-state.ts";
import { container } from "./di-container.ts";
import { EventProcessorService } from "./gameplay/event-processor-service.ts";
import { EventConsumerService } from "./gameplay/event-consumer-service.ts";
import { CameraService } from "./gameplay/camera-service.ts";
import { AnimationLogService } from "./gameplay/animation-log-service.ts";
import { RecorderService } from "./gameplay/recorder-service.ts";
import { RecordingPlayerService } from "./gameplay/recording-player-service.ts";
import { SceneTransitionService } from "./gameplay/scene-transition-service.ts";
import { SceneManagerService } from "./gameplay/scene-manager-service.ts";
import { TimerManagerService } from "./gameplay/timer-manager-service.ts";
import { IntervalManagerService } from "./gameplay/interval-manager-service.ts";
import { DebugService } from "./debug/debug-service.ts";
import { TIMER_MANAGER_SERVICE_TOKEN } from "../interfaces/services/gameplay/timer-manager-service-interface.ts";
import { INTERVAL_MANAGER_SERVICE_TOKEN } from "../interfaces/services/gameplay/interval-manager-service-interface.ts";
import { EVENT_PROCESSOR_SERVICE_TOKEN } from "../interfaces/services/events/event-processor-service-contract.ts";
import { EVENT_CONSUMER_SERVICE_TOKEN } from "../interfaces/services/gameplay/event-consumer-service-interface.ts";
import { SCENE_TRANSITION_SERVICE_TOKEN } from "../interfaces/services/scene/scene-transition-service-contract.ts";

export class ServiceRegistry {
  public static async register(
    canvas: HTMLCanvasElement,
    debugging: boolean
  ): Promise<void> {
    container.bind({ provide: HTMLCanvasElement, useValue: canvas });
    const gameState = new GameState(canvas, debugging);
    container.bind({ provide: GameState, useValue: gameState });
    container.bind({
      provide: EventProcessorService,
      useClass: EventProcessorService,
    });
    container.bind({
      provide: EventConsumerService,
      useClass: EventConsumerService,
    });
    container.bind({
      provide: AnimationLogService,
      useClass: AnimationLogService,
    });
    container.bind({ provide: CameraService, useClass: CameraService });
    container.bind({ provide: RecorderService, useClass: RecorderService });
    container.bind({
      provide: RecordingPlayerService,
      useClass: RecordingPlayerService,
    });
    container.bind({
      provide: SceneTransitionService,
      useClass: SceneTransitionService,
    });
    container.bind({
      provide: SceneManagerService,
      useClass: SceneManagerService,
    });
    container.bind({
      provide: TimerManagerService,
      useClass: TimerManagerService,
    });
    container.bind({
      provide: IntervalManagerService,
      useClass: IntervalManagerService,
    });
    container.bind({ provide: DebugService, useClass: DebugService });

    // Contract tokens resolve to the same singleton instances
    container.bind({
      provide: TIMER_MANAGER_SERVICE_TOKEN,
      useExisting: TimerManagerService,
    });
    container.bind({
      provide: INTERVAL_MANAGER_SERVICE_TOKEN,
      useExisting: IntervalManagerService,
    });
    container.bind({
      provide: EVENT_PROCESSOR_SERVICE_TOKEN,
      useExisting: EventProcessorService,
    });
    container.bind({
      provide: EVENT_CONSUMER_SERVICE_TOKEN,
      useExisting: EventConsumerService,
    });
    container.bind({
      provide: SCENE_TRANSITION_SERVICE_TOKEN,
      useExisting: SceneTransitionService,
    });

    if (debugging) {
      const debugService = container.get(DebugService);
      await debugService.init();
    }
  }
}
