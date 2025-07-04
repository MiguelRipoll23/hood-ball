import { GameState } from "../../core/services/game-state.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class LoadingIndicatorService {
  private activeRequests = 0;

  constructor(private gameState = container.get(GameState)) {}

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
