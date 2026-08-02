import { GameFrame } from "./game-frame.js";
import { GamePointer } from "./game-pointer.js";
import { DebugSettings } from "./debug-settings.js";
import { GameKeyboard } from "./game-keyboard.js";
import { GameGamepad } from "./game-gamepad.js";
import { CameraService } from "../services/gameplay/camera-service.js";

export class GameState {
  private debugSettings: DebugSettings;

  private gameFrame: GameFrame;

  private gamePointer: GamePointer;
  private gameKeyboard: GameKeyboard;
  private gameGamepad: GameGamepad;
  private readonly cameraService: CameraService;

  constructor(private readonly canvas: HTMLCanvasElement, debugging: boolean) {
    this.debugSettings = new DebugSettings(debugging);
    this.gameFrame = new GameFrame();
    this.gamePointer = new GamePointer(this.canvas);
    this.gameKeyboard = new GameKeyboard();
    this.gameGamepad = new GameGamepad(this.gameFrame);
    this.cameraService = new CameraService();
  }

  public isDebugging(): boolean {
    return this.debugSettings.isDebugging();
  }

  public getDebugSettings(): DebugSettings {
    return this.debugSettings;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getGameFrame(): GameFrame {
    return this.gameFrame;
  }

  public getGamePointer(): GamePointer {
    return this.gamePointer;
  }

  public getGameKeyboard(): GameKeyboard {
    return this.gameKeyboard;
  }

  public getGameGamepad(): GameGamepad {
    return this.gameGamepad;
  }

  public getCameraService(): CameraService {
    return this.cameraService;
  }
}
