import { ServiceLocator } from "./service-locator.js";
import { GameState } from "../models/game-state.js";

export class LoadingIndicatorService {
  private activeRequests = 0;

  constructor(private gameState = ServiceLocator.get(GameState)) {}

  public startLoading(): void {
    this.activeRequests++;
    this.gameState.getGameFrame().getLoadingIndicatorObject()?.show();
  }

  public stopLoading(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }

    if (this.activeRequests === 0) {
      this.gameState.getGameFrame().getLoadingIndicatorObject()?.hide();
    }
  }
}
