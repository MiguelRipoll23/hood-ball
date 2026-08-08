import { injectable, inject } from "@needle-di/core";
import { BinaryReader } from "../../../engine/utils/binary-reader-utils.js";
import { GameServer } from "../../models/game-server.js";
import { AntiCheatMonitorService } from "./anti-cheat-monitor-service.js";
import { ANTI_CHEAT_CONFIG_KEY } from "../../constants/configuration-constants.js";
import { Base64Utils } from "../../../engine/utils/base64-utils.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { parseAntiCheatRules } from "../../utils/anti-cheat-utils.js";
import type { TrackedEntity } from "../../utils/anti-cheat-utils.js";

@injectable()
export class AntiCheatService {
  constructor(
    private readonly gameServer: GameServer = inject(GameServer),
    private readonly monitor: AntiCheatMonitorService = inject(
      AntiCheatMonitorService,
    ),
  ) {}

  // -------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------

  public loadConfigurationFromGameServer(): void {
    const config = this.gameServer.getConfiguration();
    if (config === null) return;

    const raw = config[ANTI_CHEAT_CONFIG_KEY];
    if (typeof raw !== "string" || raw.length === 0) {
      console.log("[AntiCheat] No configuration key found, skipping");
      return;
    }

    try {
      const decoded = Base64Utils.base64UrlToArrayBuffer(raw);
      const rules = parseAntiCheatRules(decoded);
      this.monitor.setRules(rules);
      console.log(
        `[AntiCheat] Loaded ${rules.length} rule(s) from game configuration`,
      );
    } catch (error) {
      console.error("[AntiCheat] Failed to parse configuration rules:", error);
    }
  }

  // -------------------------------------------------------------------
  // WebSocket
  // -------------------------------------------------------------------

  @ServerCommandHandler(WebSocketType.AntiCheat)
  public handleAntiCheatMessage(binaryReader: BinaryReader): void {
    try {
      const remaining = binaryReader.bytesAsArrayBuffer();
      const rules = parseAntiCheatRules(remaining);
      this.monitor.setRules(rules);
      console.log(
        `[AntiCheat] Updated ${rules.length} rule(s) from server push`,
      );
    } catch (error) {
      console.error("[AntiCheat] Failed to parse server-pushed rules:", error);
    }
  }

  // -------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------

  public startMonitoring(): void {
    this.monitor.start();
  }

  public stopMonitoring(): void {
    this.monitor.stop();
  }

  public update(
    _deltaTimeMs: number,
    entities: Iterable<TrackedEntity>,
  ): void {
    this.monitor.update(entities);
  }

  public getRules() {
    return this.monitor.getRules();
  }
}
