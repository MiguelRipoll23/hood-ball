import { DebugSettings } from "../models/debug-settings.js";
import { GameFrame } from "../models/game-frame.js";
import { GamePointer } from "../models/game-pointer.js";
import { GameKeyboard } from "../models/game-keyboard.js";
import { GameGamepad } from "../models/game-gamepad.js";
import type { EngineContext } from "./engine-context.js";

/**
 * Holds rendering and input state that is required by the engine regardless of the active game.
 */
export class EngineState implements EngineContext {
  private readonly debugSettings: DebugSettings;
  private readonly gameFrame: GameFrame;
  private readonly gamePointer: GamePointer;
  private readonly gameKeyboard: GameKeyboard;
  private readonly gameGamepad: GameGamepad;

  constructor(private readonly canvas: HTMLCanvasElement, debugging: boolean) {
    this.debugSettings = new DebugSettings(debugging);
    this.gameFrame = new GameFrame();
    this.gamePointer = new GamePointer(canvas);
    this.gameKeyboard = new GameKeyboard();
    this.gameGamepad = new GameGamepad(this.gameFrame);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getDebugSettings(): DebugSettings {
    return this.debugSettings;
  }

  public isDebugging(): boolean {
    return this.debugSettings.isDebugging();
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
}

