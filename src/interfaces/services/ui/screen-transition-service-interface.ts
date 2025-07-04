import type { GameFrame } from "../../../models/game-frame.js";
import type { GameScreen } from "../../screens/game-screen.js";

export interface IScreenTransitionService {
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  isTransitionActive(): boolean;
  fadeOutAndIn(frame: GameFrame, nextScreen: GameScreen, outSeconds: number, inSeconds: number): void;
  crossfade(frame: GameFrame, nextScreen: GameScreen, seconds: number): void;
}
