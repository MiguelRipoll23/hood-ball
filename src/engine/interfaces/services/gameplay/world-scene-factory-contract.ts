import { InjectionToken } from "@needle-di/core";
import type { GameScene } from "../../scenes/game-scene-interface.js";

export interface WorldSceneFactoryOptions {
  replayMode?: boolean;
}

export interface WorldSceneFactoryContract {
  create(options?: WorldSceneFactoryOptions): GameScene;
}

export const WORLD_SCENE_FACTORY_TOKEN =
  new InjectionToken<WorldSceneFactoryContract>("WorldSceneFactoryContract");
