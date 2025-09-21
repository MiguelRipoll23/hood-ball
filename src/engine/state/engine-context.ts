import { InjectionToken } from "@needle-di/core";
import type { GameFrame } from "../models/game-frame.js";
import type { GamePointer } from "../models/game-pointer.js";
import type { GameKeyboard } from "../models/game-keyboard.js";
import type { GameGamepad } from "../models/game-gamepad.js";

/**
 * Shared engine data exposed to game modules without leaking concrete state classes.
 */
export interface EngineContext {
  getCanvas(): HTMLCanvasElement;
  getGameFrame(): GameFrame;
  getGamePointer(): GamePointer;
  getGameKeyboard(): GameKeyboard;
  getGameGamepad(): GameGamepad;
  isDebugging(): boolean;
}

export const ENGINE_CONTEXT_TOKEN = new InjectionToken("EngineContext");

