import { GameState } from "../../state/game-state.js";
import { injectable, inject } from "@needle-di/core";

@injectable()
export class LoadingIndicatorService {
  private activeRequests = 0;

  constructor(private readonly gameState = inject(GameState)) {}

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
