import { injectable } from "@needle-di/core";
import { DebugUtils } from "@engine/utils/debug-utils.js";
import type { GameState } from "@game/state/game-state.js";

export type WebRTCOverlayMetrics = {
  downloadKilobytesPerSecond: number;
  uploadKilobytesPerSecond: number;
};

@injectable()
export class WebRTCDebugOverlay {
  constructor(private readonly gameState: GameState) {}

  public render(context: CanvasRenderingContext2D, metrics: WebRTCOverlayMetrics): void {
    const match = this.gameState.getMatch();

    if (match === null) {
      return;
    }

    const player = this.gameState.getGamePlayer();

    if (player === null) {
      DebugUtils.renderText(context, 24, 24, "No player found");
      return;
    }

    if (player.isHost()) {
      DebugUtils.renderText(context, 24, 48, "Host");
    } else {
      const pingTime = player.getPingTime();
      const displayPingTime = pingTime === null ? "--- ms" : `${pingTime} ms`;
      DebugUtils.renderText(context, 24, 48, `Ping: ${displayPingTime}`);
    }

    DebugUtils.renderText(
      context,
      24,
      72,
      `Download: ${metrics.downloadKilobytesPerSecond.toFixed(1)} KB/s`
    );

    DebugUtils.renderText(
      context,
      24,
      96,
      `Upload: ${metrics.uploadKilobytesPerSecond.toFixed(1)} KB/s`
    );
  }
}
