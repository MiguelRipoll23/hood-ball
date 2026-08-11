import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { GamePlayer } from "../models/game-player.js";
import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import { SmallButtonEntity } from "../entities/common/small-button-entity.js";

const BUTTON_WIDTH = 80;
const BUTTON_HEIGHT = 32;
const LINE_HEIGHT = 40;

/**
 * Script behaviour for a player list item row. Renders the player name
 * with team color and optional report/ban buttons.
 * Attached to PlayerListItemEntity via ScriptComponent.
 */
export class PlayerListItemScript implements ScriptLifecycle {
  private player: GamePlayer;
  private isLocalPlayer: boolean;
  private containerWidth: number;

  private reportButton: SmallButtonEntity | null = null;
  private banButton: SmallButtonEntity | null = null;

  private transform!: TransformComponent;

  constructor(
    player: GamePlayer,
    isLocalPlayer: boolean,
    containerWidth: number,
    isModerator: boolean,
  ) {
    this.player = player;
    this.isLocalPlayer = isLocalPlayer;
    this.containerWidth = containerWidth;

    this.reportButton = new SmallButtonEntity(
      "Report", BUTTON_WIDTH, BUTTON_HEIGHT,
      "rgba(200, 50, 50, 0.8)", "#7ed321",
    );

    if (isLocalPlayer || player.isNpc()) {
      this.reportButton.setDisabled(true);
    } else if (isModerator) {
      this.banButton = new SmallButtonEntity(
        "Ban", BUTTON_WIDTH, BUTTON_HEIGHT,
        "rgba(200, 50, 50, 0.8)", "#7ed321",
      );
    }
  }

  resolveTransform(transform: TransformComponent): void {
    this.transform = transform;
  }

  init(x: number, y: number): void {
    this.transform.x = x;
    this.transform.y = y;
    this.transform.width = this.containerWidth;
    this.transform.height = LINE_HEIGHT;
    this.calculateButtonPositions();
  }

  getPlayer(): GamePlayer { return this.player; }

  setPosition(x: number, y: number): void {
    this.transform.x = x;
    this.transform.y = y;
    this.calculateButtonPositions();
  }

  setContainerWidth(width: number): void {
    this.containerWidth = width;
    this.transform.width = width;
    this.calculateButtonPositions();
  }

  load(): void {
    this.reportButton?.load();
    this.banButton?.load();
  }

  handlePointerEvent(
    gamePointer: import("../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract,
  ): void {
    this.reportButton?.handlePointerEvent(gamePointer);
    this.banButton?.handlePointerEvent(gamePointer);
  }

  isReportButtonPressed(): boolean {
    return this.reportButton?.isButtonPressed() ?? false;
  }

  isBanButtonPressed(): boolean {
    return this.banButton?.isButtonPressed() ?? false;
  }

  update(delta: DOMHighResTimeStamp): void {
    this.reportButton?.update(delta);
    this.banButton?.update(delta);
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();

    const teamColor = this.isLocalPlayer ? BLUE_TEAM_COLOR : RED_TEAM_COLOR;

    let playerName = this.player.getName();
    if (!this.player.isNpc()) {
      playerName = "👤 " + playerName;
    }

    context.font = "bold 18px system-ui";
    context.fillStyle = teamColor;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText(playerName, this.transform.x, this.transform.y);

    this.reportButton?.render(context);
    this.banButton?.render(context);

    context.restore();
  }

  private calculateButtonPositions(): void {
    if (this.reportButton) {
      this.reportButton.setPosition(
        this.transform.x + this.containerWidth - 10 - BUTTON_WIDTH,
        this.transform.y - 5,
      );
    }
    if (this.banButton) {
      this.banButton.setPosition(
        this.transform.x + this.containerWidth - 20 - BUTTON_WIDTH * 2,
        this.transform.y - 5,
      );
    }
  }
}
