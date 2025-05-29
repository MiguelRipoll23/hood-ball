import "./main.css";
import { GameLoopService } from "./services/game-loop-service.js";

const canvas = document.querySelector("#game") as HTMLCanvasElement;

const gameLoop = new GameLoopService(canvas);
gameLoop.start();
