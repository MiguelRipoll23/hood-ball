import { BaseTappableGameEntity } from "../../engine/entities/base-tappable-game-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import { SmallButtonEntity } from "./common/small-button-entity.js";

export class PlayerListItemEntity extends BaseTappableGameEntity {
  private readonly PLAYER_FONT = "bold 18px system-ui";
  private readonly BUTTON_WIDTH = 80;
  private readonly BUTTON_HEIGHT = 32;
  private readonly LINE_HEIGHT = 40;

  private player: GamePlayer;
  private isLocalPlayer: boolean;
  private containerWidth: number;
  
  private reportButton: SmallButtonEntity | null = null;
  private banButton: SmallButtonEntity | null = null;

  constructor(
    player: GamePlayer,
    isLocalPlayer: boolean,
    x: number,
    y: number,
    containerWidth: number,
    isModerator: boolean
  ) {
    super();
    this.player = player;
    this.isLocalPlayer = isLocalPlayer;
    this.x = x;
    this.y = y;
    this.containerWidth = containerWidth;
    this.width = containerWidth;
    this.height = this.LINE_HEIGHT;

    this.reportButton = new SmallButtonEntity(
      "Report",
      this.BUTTON_WIDTH,
      this.BUTTON_HEIGHT,
      "rgba(200, 50, 50, 0.8)", // Default red background
      "#7ed321" // Green hover color
    );
    
    if (isLocalPlayer || player.isNpc()) {
      this.reportButton.setDisabled(true);
    } else if (isModerator) {
      this.banButton = new SmallButtonEntity(
        "Ban",
        this.BUTTON_WIDTH,
        this.BUTTON_HEIGHT,
        "rgba(200, 50, 50, 0.8)", // Default red background
        "#7ed321" // Green hover color
      );
    }

    this.calculateButtonPositions();
  }

  public getPlayer(): GamePlayer {
    return this.player;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.calculateButtonPositions();
  }

  public setContainerWidth(width: number): void {
    this.containerWidth = width;
    this.width = width;
    this.calculateButtonPositions();
  }

  public override load(): void {
    this.reportButton?.load();
    this.banButton?.load();
    super.load();
  }

  private calculateButtonPositions(): void {
    // Report button (Rightmost)
    if (this.reportButton) {
      const buttonX = this.x + this.containerWidth - 10 - this.BUTTON_WIDTH;
      const buttonY = this.y - 5;
      this.reportButton.setPosition(buttonX, buttonY);
    }
    
    // Ban button (Left of Report button)
    if (this.banButton) {
      const buttonX = this.x + this.containerWidth - 20 - (this.BUTTON_WIDTH * 2);
      const buttonY = this.y - 5;
      this.banButton.setPosition(buttonX, buttonY);
    }
  }

  public override handlePointerEvent(
    gamePointer: import("../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract
  ): void {
    this.reportButton?.handlePointerEvent(gamePointer);
    this.banButton?.handlePointerEvent(gamePointer);
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.reportButton?.update(delta);
    this.banButton?.update(delta);
    super.update(delta);
  }

  public isReportButtonPressed(): boolean {
    return this.reportButton?.isButtonPressed() ?? false;
  }
  
  public isBanButtonPressed(): boolean {
    return this.banButton?.isButtonPressed() ?? false;
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save();

    // Determine color based on local (blue) vs remote/npc (red)
    const teamColor = this.isLocalPlayer ? BLUE_TEAM_COLOR : RED_TEAM_COLOR;

    // Draw player name with team color
    let playerName = this.player.getName();
    if (!this.player.isNpc()) {
      playerName = "👤 " + playerName;
    }
    context.font = this.PLAYER_FONT;
    context.fillStyle = teamColor;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText(playerName, this.x, this.y);

    // Draw buttons if they exist
    this.reportButton?.render(context);
    this.banButton?.render(context);

    context.restore();
  }
}
