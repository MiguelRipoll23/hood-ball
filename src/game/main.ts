import "./main.css";
import { inject } from "@vercel/analytics";
import { container } from "../engine/services/di-container.js";
import { GameLoopService } from "../engine/services/gameplay/game-loop-service.js";
import { ServiceRegistry } from "../engine/services/service-registry.js";
import { GameServiceRegistry } from "./services/registry/game-service-registry.js";
import { GameLifecycleService } from "./services/lifecycle/game-lifecycle-service.js";
import { MainScene } from "./scenes/main/main-scene.js";
import { LoginScene } from "./scenes/main/login/login-scene.js";
import {
  registerGameEntityTypes,
  getEntityTypeMapper,
} from "./utils/entity-type-registry.js";
import { RecorderService } from "../engine/services/gameplay/recorder-service.js";
import { RecordingPlayerService } from "../engine/services/gameplay/recording-player-service.js";
import { registerEventTypeNames } from "./enums/event-type.js";
import { GameSceneFactory } from "./services/gameplay/game-scene-factory.js";
import { GAME_VERSION } from "./constants/game-constants.js";

class Game {
  constructor(private canvas: HTMLCanvasElement) {}

  public async start(): Promise<void> {
    await this.initializeServices();
    this.initializeLifecycle();
    await this.startGameLoop();
  }

  private async initializeServices(): Promise<void> {
    const debug = globalThis.location.search.includes("debug");
    // Register game event type names for engine-level logging
    registerEventTypeNames();

    await ServiceRegistry.register(this.canvas, debug);
    GameServiceRegistry.register();

    // Register entity types for recording/playback
    registerGameEntityTypes(this.canvas);

    // Inject entity type mapper into recorder service
    const recorderService = container.get(RecorderService);
    recorderService.setEntityTypeMapper(getEntityTypeMapper());

    // Inject scene factory into recording player service
    const recordingPlayerService = container.get(RecordingPlayerService);
    recordingPlayerService.setSceneFactory(new GameSceneFactory());

    // Set game version for debug overlay
    const gameLoopService = container.get(GameLoopService);
    gameLoopService.setDebugVersionProvider(() => GAME_VERSION);
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

// Initialize Vercel Web Analytics
inject();
