import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import { PlayerListItemEntity } from "../entities/player-list-item-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { ReportMenuEntity } from "../entities/report-menu-entity.js";
import { BanMenuEntity } from "../entities/ban-menu-entity.js";
import type { APIService } from "../services/network/api-service.js";
import type { ActionMenuContract } from "../interfaces/ui/action-menu-contract.js";

/**
 * Script behaviour for the players list in the match menu. Manages
 * PlayerListItemEntity items, report/ban popups, and pointer routing.
 * Attached to PlayersListEntity via ScriptComponent.
 */
export class PlayersListScript implements ScriptLifecycle {
  playerItems: PlayerListItemEntity[] = [];
  private reportMenuEntity: ReportMenuEntity | null = null;
  private banMenuEntity: BanMenuEntity | null = null;
  private containerX = 0;
  private containerY = 0;
  private gamePointer: GamePointerContract | null = null;
  private onReport:
    | ((playerId: string, reason: string, playerName: string) => void)
    | null = null;
  private onBan:
    | ((playerId: string, reason: string, playerName: string, duration?: { value: number; unit: string }) => void)
    | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private readonly apiService: APIService;

  constructor(apiService: APIService) {
    this.apiService = apiService;
  }

  isActionMenuOpen(): boolean {
    return (
      (this.reportMenuEntity?.isOpen() ?? false) ||
      (this.banMenuEntity?.isOpen() ?? false)
    );
  }

  setPlayers(
    players: GamePlayer[],
    localPlayerId: string,
    x: number,
    y: number,
    width: number,
    gamePointer: GamePointerContract,
    onReport: (playerId: string, reason: string, playerName: string) => void,
    onBan: (
      playerId: string,
      reason: string,
      playerName: string,
      duration?: { value: number; unit: string },
    ) => void,
    canvas: HTMLCanvasElement,
  ): void {
    this.containerX = x;
    this.containerY = y;
    this.gamePointer = gamePointer;
    this.onReport = onReport;
    this.onBan = onBan;
    this.canvas = canvas;

    const isModerator = this.apiService.hasRole("moderator");

    this.playerItems = [];
    let currentY = y + 10;

    for (const player of players) {
      const isLocal = player.getNetworkId() === localPlayerId;
      const item = new PlayerListItemEntity(
        player, isLocal, x, currentY, width, isModerator,
      );
      item.load();
      this.playerItems.push(item);
      currentY += 45;
    }
  }

  handlePointerEvent(gamePointer: GamePointerContract): void {
    if (this.reportMenuEntity?.isOpen()) {
      this.reportMenuEntity.handlePointerEvent(gamePointer);
      return;
    }

    if (this.banMenuEntity?.isOpen()) {
      this.banMenuEntity.handlePointerEvent(gamePointer);
      return;
    }

    for (const item of this.playerItems) {
      item.handlePointerEvent(gamePointer);
    }
  }

  update(delta: DOMHighResTimeStamp): void {
    if (this.reportMenuEntity?.isOpen()) {
      this.processActionMenu(
        this.reportMenuEntity,
        delta,
        () => {
          const reason = this.reportMenuEntity!.getConfirmedReason();
          const player = this.reportMenuEntity!.getReportedPlayer();
          if (reason && player && this.onReport) {
            this.onReport(player.getId(), reason, player.getName());
            return true;
          }
          return false;
        },
      );
      return;
    }

    if (this.banMenuEntity?.isOpen()) {
      this.processActionMenu(
        this.banMenuEntity,
        delta,
        () => {
          const data = this.banMenuEntity!.getConfirmedData();
          const player = this.banMenuEntity!.getBannedPlayer();
          if (data && player && this.onBan) {
            this.onBan(
              player.getId(), data.reason, player.getName(), data.duration,
            );
            return true;
          }
          return false;
        },
      );
      return;
    }

    for (const item of this.playerItems) {
      if (item.isReportButtonPressed() && !this.isActionMenuOpen()) {
        this.openReportMenu(item.getPlayer());
      }
      if (item.isBanButtonPressed() && !this.isActionMenuOpen()) {
        this.openBanMenu(item.getPlayer());
      }
      item.update(delta);
    }
  }

  closeActiveActionMenu(): void {
    if (this.reportMenuEntity?.isOpen()) this.reportMenuEntity.close();
    if (this.banMenuEntity?.isOpen()) this.banMenuEntity.close();
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();

    context.fillStyle = "#000000";
    context.font = "bold 20px system-ui";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText("Players", this.containerX, this.containerY - 30);

    for (const item of this.playerItems) {
      item.render(context);
    }

    if (this.reportMenuEntity?.isOpen()) {
      this.reportMenuEntity.render(context);
    }

    if (this.banMenuEntity?.isOpen()) {
      this.banMenuEntity.render(context);
    }

    context.restore();
  }

  private processActionMenu(
    menu: ActionMenuContract,
    delta: DOMHighResTimeStamp,
    onConfirm: () => boolean,
  ): void {
    menu.update(delta);

    if (onConfirm()) {
      this.gamePointer?.clearPressed();
    } else if (menu.isCancelled()) {
      menu.close();
      this.gamePointer?.clearPressed();
    }
  }

  private openReportMenu(player: GamePlayer): void {
    if (!this.reportMenuEntity && this.canvas) {
      this.reportMenuEntity = new ReportMenuEntity(this.canvas);
      this.reportMenuEntity.load();
    }
    this.reportMenuEntity?.open(player);
  }

  private openBanMenu(player: GamePlayer): void {
    if (!this.banMenuEntity && this.canvas) {
      this.banMenuEntity = new BanMenuEntity(this.canvas);
      this.banMenuEntity.load();
    }
    this.banMenuEntity?.open(player);
  }
}
