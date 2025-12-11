import { GameState } from "../models/game-state.ts";
import { container } from "./di-container.ts";
import { EventProcessorService } from "./gameplay/event-processor-service.ts";
import { EventConsumerService } from "./gameplay/event-consumer-service.ts";
import { CameraService } from "./gameplay/camera-service.ts";
import { AnimationLogService } from "./gameplay/animation-log-service.ts";
import { RecorderService } from "./gameplay/recorder-service.ts";
import { MediaPlayerService } from "./gameplay/player-service.ts";
import { SceneTransitionService } from "./gameplay/scene-transition-service.ts";
import { SceneManagerService } from "./gameplay/scene-manager-service.ts";
import { TimerManagerService } from "./gameplay/timer-manager-service.ts";
import { IntervalManagerService } from "./gameplay/interval-manager-service.ts";
import { DebugService } from "./debug/debug-service.ts";

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
      provide: MediaPlayerService,
      useClass: MediaPlayerService,
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

    if (debugging) {
      const debugService = container.get(DebugService);
      await debugService.init();
    }
  }
}
