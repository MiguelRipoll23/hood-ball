import "./main.css";
import { GameLoopService } from "./core/services/game-loop-service.js";

const canvas = document.querySelector("#game") as HTMLCanvasElement;

if (!canvas) {
  throw new Error("Canvas element with id 'game' not found");
}

const gameLoop = new GameLoopService(canvas);
gameLoop.start();
