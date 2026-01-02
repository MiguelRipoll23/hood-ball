import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { PlayerListItemEntity } from "./player-list-item-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { ReportMenuEntity } from "./report-menu-entity.js";

export class PlayersListEntity extends BaseGameEntity {
  private playerItems: PlayerListItemEntity[] = [];
  private reportMenuEntity: ReportMenuEntity | null = null;
  private containerX = 0;
  private containerY = 0;
  private gamePointer: GamePointerContract | null = null;
  private onReport: ((playerId: string, reason: string) => void) | null = null;
  private canvas: HTMLCanvasElement | null = null;

  public setPlayers(
    players: GamePlayer[],
    localPlayerId: string,
    x: number,
    y: number,
    width: number,
    gamePointer: GamePointerContract,
    onReport: (playerId: string, reason: string) => void,
    canvas: HTMLCanvasElement
  ): void {
    this.containerX = x;
    this.containerY = y;
    this.gamePointer = gamePointer;
    this.onReport = onReport;
    this.canvas = canvas;

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
        width
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

  public handlePointerEvent(gamePointer: GamePointerContract): void {
    // Check if report menu is open
    if (this.reportMenuEntity && this.reportMenuEntity.isOpen()) {
      this.reportMenuEntity.handlePointerEvent(gamePointer);
      return;
    }

    // Forward to player items
    for (const item of this.playerItems) {
      item.handlePointerEvent(gamePointer);
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    // Check if report menu is open
    if (this.reportMenuEntity && this.reportMenuEntity.isOpen()) {
      // Handle report menu
      this.reportMenuEntity.update(delta);

      // Check if confirmed
      const selectedReason = this.reportMenuEntity.getConfirmedReason();
      if (selectedReason && this.onReport) {
        const reportedPlayer = this.reportMenuEntity.getReportedPlayer();
        if (reportedPlayer) {
          this.onReport(reportedPlayer.getNetworkId(), selectedReason);
        }
        this.reportMenuEntity.close();
      }

      // Check if cancelled
      if (this.reportMenuEntity.isCancelled()) {
        this.reportMenuEntity.close();
        // Consume the event so MatchMenuEntity doesn't process it
        if (this.gamePointer) {
          this.gamePointer.clearPressed();
        }
      }

      return;
    }

    // Update player items and check for report button presses
    for (const item of this.playerItems) {
      // Check if report button was pressed BEFORE calling update
      if (item.isReportButtonPressed()) {
        this.openReportMenu(item.getPlayer());
      }

      item.update(delta);
    }

    super.update(delta);
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

    context.restore();
  }
}
