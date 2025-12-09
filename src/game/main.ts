import "./main.css";
import { Game } from "./game.js";

const canvas = document.querySelector("#game") as HTMLCanvasElement;

if (!canvas) {
  throw new Error("Canvas element with id 'game' not found");
}

const game = new Game(canvas);
game.start();
