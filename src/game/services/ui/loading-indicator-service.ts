import { GameState } from "../../../engine/models/game-state.js";
import { container } from "../../../engine/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class LoadingIndicatorService {
  private activeRequests = 0;

  constructor(private gameState = container.get(GameState)) {}

  public startLoading(): void {
    this.activeRequests++;
    this.gameState.getGameFrame().getLoadingIndicatorEntity()?.show();
  }

  public stopLoading(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }

    if (this.activeRequests === 0) {
      this.gameState.getGameFrame().getLoadingIndicatorEntity()?.hide();
    }
  }
}
