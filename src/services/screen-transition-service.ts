import type { GameScreen } from "../interfaces/screens/game-screen.js";
import type { ScreenManager } from "../interfaces/screens/screen-manager.js";
import type { GameFrame } from "../models/game-frame.js";
import { injectable } from "@needle-di/core";

@injectable()
export class ScreenTransitionService {
  private elapsedTransitionMilliseconds: number = 0;

  // Transition state flags
  private isFadingOutAndIn: boolean = false;
  private isCrossfading: boolean = false;

  // Duration properties in milliseconds
  private fadeInDurationMilliseconds: number = 0;
  private fadeOutDurationMilliseconds: number = 0;
  private crossfadeDurationMilliseconds: number = 0;

  private screenManager: GameFrame | ScreenManager | null = null;

  constructor() {}

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.screenManager === null) {
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
      this.screenManager !== null &&
      (this.isFadingOutAndIn || this.isCrossfading)
    );
  }

  public fadeOutAndIn(
    screenManager: GameFrame | ScreenManager,
    nextScreen: GameScreen,
    fadeOutDurationSeconds: number,
    fadeInDurationSeconds: number
  ): void {
    this.screenManager = screenManager;

    if (this.isNextScreenAlreadySet(nextScreen)) {
      console.warn("Ignoring duplicated transition to the same screen");
      return;
    }

    console.log("Fading out and in to", nextScreen.constructor.name);

    // Check if there is an active transition
    if (this.isTransitionActive()) {
      this.resetTransitionState();
    }

    nextScreen.setOpacity(0);
    nextScreen.onTransitionStart();

    this.screenManager.setNextScreen(nextScreen);
    this.fadeOutDurationMilliseconds = fadeOutDurationSeconds * 1000;
    this.fadeInDurationMilliseconds = fadeInDurationSeconds * 1000;
    this.isFadingOutAndIn = true;
  }

  public crossfade(
    screenManager: GameFrame | ScreenManager,
    nextScreen: GameScreen,
    crossfadeDurationSeconds: number
  ): void {
    this.screenManager = screenManager;

    if (this.isNextScreenAlreadySet(nextScreen)) {
      console.warn("Ignoring duplicated transition to the same screen");
      return;
    }

    console.log("Crossfading to", nextScreen.constructor.name);

    // Check if there is an active transition
    if (this.isTransitionActive()) {
      this.resetTransitionState();
    }

    nextScreen.setOpacity(0);
    nextScreen.onTransitionStart();

    this.screenManager.setNextScreen(nextScreen);
    this.crossfadeDurationMilliseconds = crossfadeDurationSeconds * 1000;
    this.isCrossfading = true;
  }

  private isNextScreenAlreadySet(nextScreen: GameScreen): boolean {
    if (this.screenManager === null) {
      return false;
    }

    const currentNextScreen = this.screenManager.getNextScreen();

    return currentNextScreen?.constructor === nextScreen.constructor;
  }

  private handleFadingOutAndIn(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.screenManager === null) return;

    this.elapsedTransitionMilliseconds += deltaTimeStamp;

    const currentScreen = this.screenManager.getCurrentScreen();
    const nextScreen = this.screenManager.getNextScreen();

    if (!currentScreen || !nextScreen) return;

    if (currentScreen?.getOpacity() > 0) {
      this.fadeOutCurrentScreen(currentScreen);
    } else {
      this.fadeInNextScreen(nextScreen);
    }
  }

  private fadeOutCurrentScreen(currentScreen: GameScreen): void {
    const fadeOutOpacity = Math.min(
      1,
      this.elapsedTransitionMilliseconds / this.fadeOutDurationMilliseconds
    );

    if (fadeOutOpacity === 1) {
      // Fade out complete
      this.elapsedTransitionMilliseconds = 0;
    }

    currentScreen.setOpacity(1 - fadeOutOpacity);
  }

  private fadeInNextScreen(nextScreen: GameScreen): void {
    const fadeInOpacity = Math.min(
      1,
      this.elapsedTransitionMilliseconds / this.fadeInDurationMilliseconds
    );

    nextScreen.setOpacity(fadeInOpacity);

    if (fadeInOpacity === 1) {
      this.updateCurrentAndNextScreen(nextScreen);
    }
  }

  private handleCrossfading(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.screenManager === null) return;

    const currentScreen = this.screenManager.getCurrentScreen();
    const nextScreen = this.screenManager.getNextScreen();

    if (!nextScreen || !nextScreen.hasLoaded()) return;

    this.elapsedTransitionMilliseconds += deltaTimeStamp;

    const crossfadeOpacity = Math.min(
      1,
      this.elapsedTransitionMilliseconds / this.crossfadeDurationMilliseconds
    );

    if (currentScreen !== null) {
      currentScreen.setOpacity(1 - crossfadeOpacity);
    }

    nextScreen.setOpacity(crossfadeOpacity);

    if (crossfadeOpacity === 1) {
      this.updateCurrentAndNextScreen(nextScreen);
    }
  }

  private resetTransitionState(): void {
    this.isFadingOutAndIn = false;
    this.isCrossfading = false;
    this.elapsedTransitionMilliseconds = 0;
  }

  private updateCurrentAndNextScreen(nextScreen: GameScreen): void {
    if (this.screenManager === null) return;

    this.resetTransitionState();

    this.screenManager.setCurrentScreen(nextScreen);
    this.screenManager.setNextScreen(null);

    this.screenManager.getCurrentScreen()?.onTransitionEnd();

    this.screenManager = null;
  }
}
