import { container } from "../engine/services/di-container.js";
import { GameLoopService } from "../engine/services/gameplay/game-loop-service.js";
import { ServiceRegistry } from "../engine/services/service-registry.js";
import { GameServiceRegistry } from "./services/registry/game-service-registry.js";
import { GameLifecycleService } from "./services/lifecycle/game-lifecycle-service.js";
import { GameState } from "../engine/models/game-state.js";
import { EventConsumerService } from "../engine/services/gameplay/event-consumer-service.js";
import { DebugService } from "../engine/services/debug/debug-service.js";
import { DebugWindow } from "./debug/debug-window.js";
import { MainScene } from "./scenes/main/main-scene.js";
import { LoginScene } from "./scenes/main/login/login-scene.js";
import { SceneManagerService } from "../engine/services/gameplay/scene-manager-service.js";

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
