import { injectable } from "@needle-di/core";
import type { SceneManager } from "../../interfaces/scenes/scene-manager";
import type { GameScene } from "../../interfaces/scenes/game-scene";

@injectable()
export class SceneTransitionService {
  private elapsedTransitionMilliseconds: number = 0;

  // Transition state flags
  private isFadingOutAndIn: boolean = false;
  private isCrossfading: boolean = false;

  // Duration properties in milliseconds
  private fadeInDurationMilliseconds: number = 0;
  private fadeOutDurationMilliseconds: number = 0;
  private crossfadeDurationMilliseconds: number = 0;

  private sceneManager: SceneManager | null = null;

  constructor() {}

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.sceneManager === null) {
      return;
    }

    if (this.isFadingOutAndIn) {
      this.handleFadingOutAndIn(deltaTimeStamp);
    } else if (this.isCrossfading) {
      this.handleCrossfading(deltaTimeStamp);
    }
  }

  public isTransitionActive(): boolean {
    return (
      this.sceneManager !== null &&
      (this.isFadingOutAndIn || this.isCrossfading)
    );
  }

  public fadeOutAndIn(
    sceneManager: SceneManager,
    nextScene: GameScene,
    fadeOutDurationSeconds: number,
    fadeInDurationSeconds: number
  ): void {
    this.sceneManager = sceneManager;

    if (this.isNextSceneAlreadySet(nextScene)) {
      console.warn("Ignoring duplicated transition to the same scene");
      return;
    }

    console.log("Fading out and in to", nextScene.constructor.name);

    // Check if there is an active transition
    if (this.isTransitionActive()) {
      this.resetTransitionState();
    }

    nextScene.setOpacity(0);
    nextScene.onTransitionStart();

    this.sceneManager.setNextScene(nextScene);
    this.fadeOutDurationMilliseconds = fadeOutDurationSeconds * 1000;
    this.fadeInDurationMilliseconds = fadeInDurationSeconds * 1000;
    this.isFadingOutAndIn = true;
  }

  public crossfade(
    sceneManager: SceneManager,
    nextScene: GameScene,
    crossfadeDurationSeconds: number
  ): void {
    this.sceneManager = sceneManager;

    if (this.isNextSceneAlreadySet(nextScene)) {
      console.warn("Ignoring duplicated transition to the same scene");
      return;
    }

    console.log("Crossfading to", nextScene.constructor.name);

    // Check if there is an active transition
    if (this.isTransitionActive()) {
      this.resetTransitionState();
    }

    nextScene.setOpacity(0);
    nextScene.onTransitionStart();

    this.sceneManager.setNextScene(nextScene);
    this.crossfadeDurationMilliseconds = crossfadeDurationSeconds * 1000;
    this.isCrossfading = true;
  }

  private isNextSceneAlreadySet(nextScene: GameScene): boolean {
    if (this.sceneManager === null) {
      return false;
    }

    const currentNextScene = this.sceneManager.getNextScene();

    return currentNextScene?.constructor === nextScene.constructor;
  }

  private handleFadingOutAndIn(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.sceneManager === null) return;

    this.elapsedTransitionMilliseconds += deltaTimeStamp;

    const currentScene = this.sceneManager.getCurrentScene();
    const nextScene = this.sceneManager.getNextScene();

    if (!currentScene || !nextScene) return;

    if (currentScene?.getOpacity() > 0) {
      this.fadeOutCurrentScene(currentScene);
    } else {
      this.fadeInNextScene(nextScene);
    }
  }

  private fadeOutCurrentScene(currentScene: GameScene): void {
    const fadeOutOpacity = Math.min(
      1,
      this.elapsedTransitionMilliseconds / this.fadeOutDurationMilliseconds
    );

    if (fadeOutOpacity === 1) {
      // Fade out complete
      this.elapsedTransitionMilliseconds = 0;
    }

    currentScene.setOpacity(1 - fadeOutOpacity);
  }

  private fadeInNextScene(nextScene: GameScene): void {
    const fadeInOpacity = Math.min(
      1,
      this.elapsedTransitionMilliseconds / this.fadeInDurationMilliseconds
    );

    nextScene.setOpacity(fadeInOpacity);

    if (fadeInOpacity === 1) {
      this.updateCurrentAndNextScene(nextScene);
    }
  }

  private handleCrossfading(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.sceneManager === null) return;

    const currentScene = this.sceneManager.getCurrentScene();
    const nextScene = this.sceneManager.getNextScene();

    if (!nextScene || !nextScene.hasLoaded()) return;

    this.elapsedTransitionMilliseconds += deltaTimeStamp;

    const crossfadeOpacity = Math.min(
      1,
      this.elapsedTransitionMilliseconds / this.crossfadeDurationMilliseconds
    );

    if (currentScene !== null) {
      currentScene.setOpacity(1 - crossfadeOpacity);
    }

    nextScene.setOpacity(crossfadeOpacity);

    if (crossfadeOpacity === 1) {
      this.updateCurrentAndNextScene(nextScene);
    }
  }

  private resetTransitionState(): void {
    this.isFadingOutAndIn = false;
    this.isCrossfading = false;
    this.elapsedTransitionMilliseconds = 0;
  }

  private updateCurrentAndNextScene(nextScene: GameScene): void {
    if (this.sceneManager === null) return;

    this.resetTransitionState();

    this.sceneManager.setCurrentScene(nextScene);
    this.sceneManager.setNextScene(null);

    this.sceneManager.getCurrentScene()?.onTransitionEnd();

    this.sceneManager = null;
  }
}
