import "./main.css";
import { startGame } from "@game/bootstrap/start-game.js";

const canvas = document.querySelector("#game") as HTMLCanvasElement;

if (canvas === null) {
  throw new Error("Canvas element with id 'game' not found");
}

const debugging = window.location.search.includes("debug");

const searchParams = new URLSearchParams(window.location.search);
const flagFromQuery = searchParams.get("loop");
const flagFromEnv = (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.VITE_USE_ENGINE_LOOP) ?? "true";
const normalizedFlag = (flagFromQuery ?? flagFromEnv).toString().toLowerCase();
const useEngineLoop = !["legacy", "false", "0"].includes(normalizedFlag);

if (!useEngineLoop) {
  console.info("Engine loop disabled via feature flag; legacy loop is no longer available.");
} else {
  const { gameLoop } = startGame(canvas, debugging);
  gameLoop.start();
}
