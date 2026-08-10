import { EngineLogger } from "../services/engine-logger.js";

export class DebugSettings {
  private debugging: boolean;

  private logWebSocketMessages: boolean = true;
  private logWebRTCMessages: boolean = false;

  private tappableAreasVisible: boolean = true;
  private hitboxVisible: boolean = true;
  private gizmosVisible: boolean = false;
  private showSyncableEntities: boolean = false;
  private menuEnabled: boolean = false;

  constructor(debugging: boolean) {
    this.debugging = debugging;
    EngineLogger.setEnabled(debugging);
  }

  public isDebugging(): boolean {
    return this.debugging;
  }

  public setDebugging(value: boolean): void {
    this.debugging = value;

    if (this.debugging) {
      // Enable logging first so the "Debug mode on" banner is captured,
      // mirroring the ?debug URL query parameter behavior.
      EngineLogger.setEnabled(true);
      EngineLogger.info(
        "DebugSettings",
        "%cDebug mode on",
        "color: #b6ff35; font-size: 20px; font-weight: bold"
      );
    } else {
      EngineLogger.info(
        "DebugSettings",
        "%cDebug mode off",
        "color: #ff5733; font-size: 20px; font-weight: bold"
      );
      EngineLogger.setEnabled(false);
    }
  }

  public isWebSocketLoggingEnabled(): boolean {
    return this.logWebSocketMessages;
  }

  public setWebSocketLogging(value: boolean): void {
    this.logWebSocketMessages = value;
    EngineLogger.info("DebugSettings", `WebSocket logging set to: ${value}`);
  }

  public isWebRTCLoggingEnabled(): boolean {
    return this.logWebRTCMessages;
  }

  public setWebRTCLogging(value: boolean): void {
    this.logWebRTCMessages = value;
    EngineLogger.info("DebugSettings", `WebRTC logging set to: ${value}`);
  }

  public areTappableAreasVisible(): boolean {
    return this.tappableAreasVisible;
  }

  public setTappableAreasVisibility(value: boolean): void {
    this.tappableAreasVisible = value;
    EngineLogger.info("DebugSettings", `Tappable areas visibility set to: ${value}`);
  }

  public areHitboxesVisible(): boolean {
    return this.hitboxVisible;
  }

  public setHitboxesVisibility(value: boolean): void {
    this.hitboxVisible = value;
    EngineLogger.info("DebugSettings", `Hitboxes visibility set to: ${value}`);
  }

  public areGizmosVisible(): boolean {
    return this.gizmosVisible;
  }

  public setGizmosVisibility(value: boolean): void {
    this.gizmosVisible = value;
    EngineLogger.info("DebugSettings", `Gizmos visibility set to: ${value}`);
  }

  public showSyncableEntitiesOverlay(): boolean {
    return this.showSyncableEntities;
  }

  public setShowSyncableEntities(value: boolean): void {
    this.showSyncableEntities = value;
    EngineLogger.info("DebugSettings", `Show syncable entities set to: ${value}`);
  }

  public isMenuEnabled(): boolean {
    return this.menuEnabled;
  }

  public setMenuEnabled(value: boolean): void {
    this.menuEnabled = value;
    EngineLogger.info("DebugSettings", `Menu enabled set to: ${value}`);
  }

}
