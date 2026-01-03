import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { PlayerListItemEntity } from "./player-list-item-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { ReportMenuEntity } from "./report-menu-entity.js";
import { BanMenuEntity } from "./ban-menu-entity.js";
import { container } from "../../engine/services/di-container.js";
import { APIService } from "../services/network/api-service.js";
import type { ActionMenuContract } from "../interfaces/ui/action-menu-contract.js";

export class PlayersListEntity extends BaseGameEntity {
  private playerItems: PlayerListItemEntity[] = [];
  private reportMenuEntity: ReportMenuEntity | null = null;
  private banMenuEntity: BanMenuEntity | null = null;
  private containerX = 0;
  private containerY = 0;
  private gamePointer: GamePointerContract | null = null;
  private onReport: ((playerId: string, reason: string) => void) | null = null;
  private onBan: ((playerId: string, reason: string, duration?: {value: number, unit: string}) => void) | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private apiService: APIService;

  constructor() {
    super();
    this.apiService = container.get(APIService);
  }

  public setPlayers(
    players: GamePlayer[],
    localPlayerId: string,
    x: number,
    y: number,
    width: number,
    gamePointer: GamePointerContract,
    onReport: (playerId: string, reason: string) => void,
    onBan: (playerId: string, reason: string, duration?: {value: number, unit: string}) => void,
    canvas: HTMLCanvasElement
  ): void {
    this.containerX = x;
    this.containerY = y;
    this.gamePointer = gamePointer;
    this.onReport = onReport;
    this.onBan = onBan;
    this.canvas = canvas;

    // Check if moderator
    const isModerator = this.apiService.hasRole("moderator");

    // Clear existing items
    this.playerItems = [];

    // Create player list items
    let currentY = y + 10;
    for (const player of players) {
      const isLocal = player.getNetworkId() === localPlayerId;
      const item = new PlayerListItemEntity(
        player,
        isLocal,
        x,
        currentY,
        width,
        isModerator
      );
      item.load();
      this.playerItems.push(item);
      currentY += 45; // Space between items
    }
  }

  public override load(): void {
    super.load();
  }

  public getPlayerItems(): PlayerListItemEntity[] {
    return this.playerItems;
  }

  public isActionMenuOpen(): boolean {
    return (this.reportMenuEntity?.isOpen() ?? false) || (this.banMenuEntity?.isOpen() ?? false);
  }

  public handlePointerEvent(gamePointer: GamePointerContract): void {
    // Check if report menu is open
    if (this.reportMenuEntity && this.reportMenuEntity.isOpen()) {
      this.reportMenuEntity.handlePointerEvent(gamePointer);
      return;
    }

    // Check if ban menu is open
    if (this.banMenuEntity && this.banMenuEntity.isOpen()) {
      this.banMenuEntity.handlePointerEvent(gamePointer);
      return;
    }

    // Forward to player items
    for (const item of this.playerItems) {
      item.handlePointerEvent(gamePointer);
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    // Process report menu
    if (this.reportMenuEntity && this.reportMenuEntity.isOpen()) {
      this.processActionMenu(
        this.reportMenuEntity,
        delta,
        () => {
          const selectedReason = this.reportMenuEntity!.getConfirmedReason();
          const reportedPlayer = this.reportMenuEntity!.getReportedPlayer();
          if (selectedReason && reportedPlayer && this.onReport) {
            this.onReport(reportedPlayer.getId(), selectedReason);
            return true;
          }
          return false;
        }
      );
      return;
    }

    // Process ban menu
    if (this.banMenuEntity && this.banMenuEntity.isOpen()) {
      this.processActionMenu(
        this.banMenuEntity,
        delta,
        () => {
          const confirmedData = this.banMenuEntity!.getConfirmedData();
          const bannedPlayer = this.banMenuEntity!.getBannedPlayer();
          if (confirmedData && bannedPlayer && this.onBan) {
            this.onBan(bannedPlayer.getId(), confirmedData.reason, confirmedData.duration);
            return true;
          }
          return false;
        }
      );
      return;
    }

    // Update player items and check for buttons
    for (const item of this.playerItems) {
      // Check if report button was pressed
      if (item.isReportButtonPressed() && !this.isActionMenuOpen()) {
        this.openReportMenu(item.getPlayer());
      }
      // Check if ban button was pressed
      if (item.isBanButtonPressed() && !this.isActionMenuOpen()) {
        this.openBanMenu(item.getPlayer());
      }

      item.update(delta);
    }

    super.update(delta);
  }

  private processActionMenu(
    menu: ActionMenuContract,
    delta: DOMHighResTimeStamp,
    onConfirm: () => boolean
  ): void {
    menu.update(delta);

    if (onConfirm()) {
      menu.close();
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
    if (this.reportMenuEntity) {
      this.reportMenuEntity.open(player);
    }
  }

  private openBanMenu(player: GamePlayer): void {
    if (!this.banMenuEntity && this.canvas) {
      this.banMenuEntity = new BanMenuEntity(this.canvas);
      this.banMenuEntity.load();
    }
    if (this.banMenuEntity) {
      this.banMenuEntity.open(player);
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    // Render section title
    context.fillStyle = "#000000";
    context.font = "bold 20px system-ui";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText("Players", this.containerX, this.containerY - 30);

    // Render all player items
    for (const item of this.playerItems) {
      item.render(context);
    }

    // Render report menu if open
    if (this.reportMenuEntity && this.reportMenuEntity.isOpen()) {
      this.reportMenuEntity.render(context);
    }
    
    // Render ban menu if open
    if (this.banMenuEntity && this.banMenuEntity.isOpen()) {
      this.banMenuEntity.render(context);
    }

    context.restore();
  }
}
