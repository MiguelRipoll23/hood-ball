import { GameState } from "../models/game-state.js";
import { container } from "./di-container.js";
import { EventProcessorService } from "./gameplay/event-processor-service.js";
import { EventConsumerService } from "./gameplay/event-consumer-service.js";
import { CameraService } from "./gameplay/camera-service.js";
import { AnimationLogService } from "./gameplay/animation-log-service.js";
import { RecorderService } from "./gameplay/recorder-service.js";
import { PlayerService } from "./gameplay/player-service.js";
import { DebugService } from "./debug/debug-service.js";
import { SceneTransitionService } from "./gameplay/scene-transition-service.js";
import { TimerManagerService } from "./gameplay/timer-manager-service.js";
import { IntervalManagerService } from "./gameplay/interval-manager-service.js";

export class ServiceRegistry {
  public static register(canvas: HTMLCanvasElement, debugging: boolean): void {
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
    container.bind({ provide: PlayerService, useClass: PlayerService });
    container.bind({ provide: DebugService, useClass: DebugService });
    container.bind({
      provide: SceneTransitionService,
      useClass: SceneTransitionService,
    });
    container.bind({
      provide: TimerManagerService,
      useClass: TimerManagerService,
    });
    container.bind({
      provide: IntervalManagerService,
      useClass: IntervalManagerService,
    });
  }
}
