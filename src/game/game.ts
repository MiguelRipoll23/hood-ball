import { container } from "../engine/services/di-container.ts";
import { GameLoopService } from "../engine/services/gameplay/game-loop-service.ts";
import { ServiceRegistry } from "../engine/services/service-registry.ts";
import { GameServiceRegistry } from "./services/registry/game-service-registry.ts";
import { GameLifecycleService } from "./services/lifecycle/game-lifecycle-service.ts";
import { GameState } from "../engine/models/game-state.ts";
import { EventConsumerService } from "../engine/services/gameplay/event-consumer-service.ts";
import { DebugService } from "../engine/services/debug/debug-service.ts";
import { DebugWindow } from "./debug/debug-window.ts";
import { MainScene } from "./scenes/main/main-scene.ts";
import { LoginScene } from "./scenes/main/login/login-scene.ts";
import { SceneManagerService } from "../engine/services/gameplay/scene-manager-service.ts";

export class Game {
  constructor(private canvas: HTMLCanvasElement) {}

  public async start(): Promise<void> {
    this.initializeServices();
    this.initializeDebug();
    this.initializeLifecycle();
    await this.startGameLoop();
  }

  private initializeServices(): void {
    const debug = globalThis.location.search.includes("debug");
    ServiceRegistry.register(this.canvas, debug);
    GameServiceRegistry.register();
  }

  private initializeDebug(): void {
    const gameState = container.get(GameState);
    const debugService = container.get(DebugService);
    const debugWindow = new DebugWindow(gameState);
    debugService.registerWindow(debugWindow);
  }

  private initializeLifecycle(): void {
    const gameLifecycleService = container.get(GameLifecycleService);
    gameLifecycleService.start();
  }

  private async startGameLoop(): Promise<void> {
    const gameState = container.get(GameState);
    const eventConsumerService = container.get(EventConsumerService);
    const gameLoop = container.get(GameLoopService);
    const sceneManagerService = container.get(SceneManagerService);

    const mainScene = new MainScene(
      gameState,
      eventConsumerService,
      sceneManagerService
    );
    const loginScene = new LoginScene(gameState, eventConsumerService);

    mainScene.activateScene(loginScene);

    await gameLoop.start(mainScene);
  }
}
