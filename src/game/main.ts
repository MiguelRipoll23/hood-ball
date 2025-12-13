import "./main.css";
import { container } from "../engine/services/di-container.js";
import { GameLoopService } from "../engine/services/gameplay/game-loop-service.js";
import { ServiceRegistry } from "../engine/services/service-registry.js";
import { GameServiceRegistry } from "./services/registry/game-service-registry.js";
import { GameLifecycleService } from "./services/lifecycle/game-lifecycle-service.js";
import { MainScene } from "./scenes/main/main-scene.js";
import { LoginScene } from "./scenes/main/login/login-scene.js";
import { registerGameEntityTypes } from "./utils/entity-type-registry.js";

class Game {
  constructor(private canvas: HTMLCanvasElement) {}

  public async start(): Promise<void> {
    await this.initializeServices();
    this.initializeLifecycle();
    await this.startGameLoop();
  }

  private async initializeServices(): Promise<void> {
    const debug = globalThis.location.search.includes("debug");
    await ServiceRegistry.register(this.canvas, debug);
    GameServiceRegistry.register();
    
    // Register entity types for recording/playback
    registerGameEntityTypes(this.canvas);
  }

  private initializeLifecycle(): void {
    const gameLifecycleService = container.get(GameLifecycleService);
    gameLifecycleService.start();
  }

  private async startGameLoop(): Promise<void> {
    const gameLoop = container.get(GameLoopService);

    const mainScene = new MainScene();
    const loginScene = new LoginScene();

    mainScene.activateScene(loginScene);

    await gameLoop.start(mainScene);
  }
}

const canvas = document.querySelector("#game") as HTMLCanvasElement;

if (!canvas) {
  throw new Error("Canvas element with id 'game' not found");
}

const game = new Game(canvas);
await game.start();
