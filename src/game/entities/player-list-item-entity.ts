import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import type { GamePlayer } from "../models/game-player.js";
import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import { SmallButtonEntity } from "./common/small-button-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";

export class PlayerListItemEntity extends BaseGameEntity {
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
    this.addComponent(new TransformComponent());
    const _s = this; this.addComponent(new ScriptComponent({ update: (dt) => _s.scriptUpdate(dt), render: (ctx) => _s.scriptRender(ctx) }));
    this.player = player;
    this.isLocalPlayer = isLocalPlayer;
    this.getComponent(TransformComponent)!.x = x;
    this.getComponent(TransformComponent)!.y = y;
    this.containerWidth = containerWidth;
    this.getComponent(TransformComponent)!.width = containerWidth;
    this.getComponent(TransformComponent)!.height = this.LINE_HEIGHT;

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
    this.getComponent(TransformComponent)!.x = x;
    this.getComponent(TransformComponent)!.y = y;
    this.calculateButtonPositions();
  }

  public setContainerWidth(width: number): void {
    this.containerWidth = width;
    this.getComponent(TransformComponent)!.width = width;
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
      const buttonX = this.getComponent(TransformComponent)!.x + this.containerWidth - 10 - this.BUTTON_WIDTH;
      const buttonY = this.getComponent(TransformComponent)!.y - 5;
      this.reportButton.setPosition(buttonX, buttonY);
    }
    
    // Ban button (Left of Report button)
    if (this.banButton) {
      const buttonX = this.getComponent(TransformComponent)!.x + this.containerWidth - 20 - (this.BUTTON_WIDTH * 2);
      const buttonY = this.getComponent(TransformComponent)!.y - 5;
      this.banButton.setPosition(buttonX, buttonY);
    }
  }

  public handlePointerEvent(
    gamePointer: import("../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract
  ): void {
    this.reportButton?.handlePointerEvent(gamePointer);
    this.banButton?.handlePointerEvent(gamePointer);
  }

  private scriptUpdate(delta: DOMHighResTimeStamp): void {
    this.reportButton?.update(delta);
    this.banButton?.update(delta);
  }

  public isReportButtonPressed(): boolean {
    return this.reportButton?.isButtonPressed() ?? false;
  }
  
  public isBanButtonPressed(): boolean {
    return this.banButton?.isButtonPressed() ?? false;
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
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
    context.fillText(playerName, this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y);

    // Draw buttons if they exist
    this.reportButton?.render(context);
    this.banButton?.render(context);

    context.restore();
  }
}
