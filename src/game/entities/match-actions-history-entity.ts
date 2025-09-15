import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { GameState } from "../../core/models/game-state.js";
import { MatchAction } from "../models/match-action.js";
import { MatchActionType } from "../enums/match-action-type.js";

interface TextPart {
  text: string;
  color: string;
}

export class MatchActionsHistoryEntity extends BaseAnimatedGameEntity {
  private readonly padding = 10;
  private readonly cornerRadius = 8;
  private readonly fontSize = 16;
  private readonly lineHeight = 16;
  private readonly actionMargin = 4;
  private readonly maxActions = 5;

  private actions: MatchAction[] = [];
  private context: CanvasRenderingContext2D;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gameState: GameState
  ) {
    super();
    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context not available");
    }
    this.context = context;
    this.opacity = 0;
  }

  public show(actions: MatchAction[]): void {
    this.actions = actions.slice(-this.maxActions);

    if (this.actions.length === 0) {
      this.width = 0;
      this.height = 0;
      if (this.opacity > 0) {
        this.fadeOut(0.2);
      }
      return;
    }

    this.measure();
    this.setPosition();

    if (this.opacity === 0) {
      this.fadeIn(0.2);
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (this.opacity === 0 || this.actions.length === 0) {
      return;
    }

    context.save();
    this.applyOpacity(context);
    this.drawBackground(context);
    this.drawText(context);
    context.restore();
  }

  private measure(): void {
    if (this.actions.length === 0) {
      this.width = 0;
      this.height = 0;
      return;
    }

    this.context.font = `${this.fontSize}px system-ui`;

    const maxWidth = this.actions.reduce((acc, action) => {
      const text = this.getTextParts(action)
        .map((part) => part.text)
        .join("");
      return Math.max(acc, this.context.measureText(text).width);
    }, 0);

    this.width = maxWidth + this.padding * 2;
    this.height =
      this.actions.length * this.lineHeight +
      (this.actions.length - 1) * this.actionMargin +
      this.padding * 2;
  }

  private setPosition(): void {
    this.x = 20;
    this.y = 20;
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.moveTo(this.x + this.cornerRadius, this.y);
    ctx.lineTo(this.x + this.width - this.cornerRadius, this.y);
    ctx.quadraticCurveTo(
      this.x + this.width,
      this.y,
      this.x + this.width,
      this.y + this.cornerRadius
    );
    ctx.lineTo(this.x + this.width, this.y + this.height - this.cornerRadius);
    ctx.quadraticCurveTo(
      this.x + this.width,
      this.y + this.height,
      this.x + this.width - this.cornerRadius,
      this.y + this.height
    );
    ctx.lineTo(this.x + this.cornerRadius, this.y + this.height);
    ctx.quadraticCurveTo(
      this.x,
      this.y + this.height,
      this.x,
      this.y + this.height - this.cornerRadius
    );
    ctx.lineTo(this.x, this.y + this.cornerRadius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + this.cornerRadius, this.y);
    ctx.closePath();
    ctx.fill();
  }

  private drawText(ctx: CanvasRenderingContext2D): void {
    ctx.font = `${this.fontSize}px system-ui`;
    ctx.textBaseline = "middle";
    let y = this.y + this.padding + this.lineHeight / 2;
    const baseX = this.x + this.padding;

    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      const parts = this.getTextParts(action);
      let x = baseX;

      for (const part of parts) {
        ctx.fillStyle = part.color;
        ctx.fillText(part.text, x, y);
        x += ctx.measureText(part.text).width;
      }

      y += this.lineHeight;
      if (i < this.actions.length - 1) {
        y += this.actionMargin;
      }
    }
  }

  private getTextParts(action: MatchAction): TextPart[] {
    if (action.getType() === MatchActionType.Goal) {
      const scorerId = action.getScorerId();
      const playerName = this.getPlayerName(scorerId);
      const playerColor = this.getPlayerColor(scorerId);

      return [
        { text: "⚽️ ", color: "white" },
        { text: playerName, color: playerColor },
        { text: " scored!", color: "white" },
      ];
    }

    const attackerId = action.getAttackerId();
    const victimId = action.getVictimId();
    const attackerName = this.getPlayerName(attackerId);
    const victimName = this.getPlayerName(victimId);
    const attackerColor = this.getPlayerColor(attackerId);
    const victimColor = this.getPlayerColor(victimId);

    return [
      { text: attackerName, color: attackerColor },
      { text: " 💣 ", color: "white" },
      { text: victimName, color: victimColor },
    ];
  }

  private getPlayerName(playerId: string | null): string {
    if (!playerId) {
      return "Unknown";
    }

    const match = this.gameState.getMatch();
    const player = match?.getPlayerByNetworkId(playerId) ?? null;

    if (player) {
      return player.getName();
    }

    const localPlayer = this.gameState.getGamePlayer();
    if (playerId === localPlayer.getNetworkId()) {
      return localPlayer.getName();
    }

    return playerId;
  }

  private getPlayerColor(playerId: string | null): string {
    if (!playerId) {
      return "white";
    }

    const localPlayerId = this.gameState.getGamePlayer().getNetworkId();
    return playerId === localPlayerId ? "#2196f3" : "#ff4d4d";
  }
}
