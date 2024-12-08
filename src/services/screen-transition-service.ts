import { GameScreen } from "../interfaces/screen/game-screen.js";
import { ScreenManager } from "../interfaces/screen/screen-manager.js";

export class ScreenTransitionService {
  private screenManager: ScreenManager;
  private elapsedTransitionMilliseconds: number = 0;

  // Transition state flags
  private isFadingOutAndIn: boolean = false;
  private isCrossfading: boolean = false;

  // Duration properties in milliseconds
  private fadeInDurationMilliseconds: number = 0;
  private fadeOutDurationMilliseconds: number = 0;
  private crossfadeDurationMilliseconds: number = 0;

  constructor(screenManager: ScreenManager) {
    this.screenManager = screenManager;
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.isFadingOutAndIn) {
      this.handleFadingOutAndIn(deltaTimeStamp);
    } else if (this.isCrossfading) {
      this.handleCrossfading(deltaTimeStamp);
    }
  }

  public isTransitionActive(): boolean {
    return this.isFadingOutAndIn || this.isCrossfading;
  }

  public fadeOutAndIn(
    nextScreen: GameScreen,
    fadeOutDurationSeconds: number,
    fadeInDurationSeconds: number
  ): void {
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

    this.screenManager.setNextScreen(nextScreen);
    this.fadeOutDurationMilliseconds = fadeOutDurationSeconds * 1000;
    this.fadeInDurationMilliseconds = fadeInDurationSeconds * 1000;
    this.isFadingOutAndIn = true;
  }

  public crossfade(
    nextScreen: GameScreen,
    crossfadeDurationSeconds: number
  ): void {
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

    this.screenManager.setNextScreen(nextScreen);
    this.crossfadeDurationMilliseconds = crossfadeDurationSeconds * 1000;
    this.isCrossfading = true;
  }

  private isNextScreenAlreadySet(nextScreen: GameScreen): boolean {
    const currentNextScreen = this.screenManager.getNextScreen();

    return currentNextScreen?.constructor === nextScreen.constructor;
  }

  private handleFadingOutAndIn(deltaTimeStamp: DOMHighResTimeStamp): void {
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
    const nextScreen = this.screenManager.getNextScreen();

    if (!nextScreen || !nextScreen.hasLoaded()) return;

    this.elapsedTransitionMilliseconds += deltaTimeStamp;

    const crossfadeOpacity = Math.min(
      1,
      this.elapsedTransitionMilliseconds / this.crossfadeDurationMilliseconds
    );

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
    this.resetTransitionState();

    this.screenManager.setCurrentScreen(nextScreen);
    this.screenManager.setNextScreen(null);

    this.screenManager.getCurrentScreen()?.hasTransitionFinished();
  }
}
