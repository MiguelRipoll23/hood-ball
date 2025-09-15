import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { GameState } from "../../core/models/game-state.js";
import { MatchAction } from "../models/match-action.js";
import { TeamType } from "../enums/team-type.js";
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
  private isFadingIn = false;
  private isFadingOut = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gameState: GameState
  ) {
    super();
    this.opacity = 0;
  }

  public show(actions: MatchAction[]): void {
    this.actions = actions.slice(-this.maxActions);

    if (this.actions.length === 0) {
      this.width = 0;
      this.height = 0;
      if ((this.opacity > 0 || this.isFadingIn) && !this.isFadingOut) {
        this.startFadeOut();
      }
      return;
    }

    this.measure();
    this.setPosition();

    if (!this.isFadingIn && (this.opacity < 1 || this.isFadingOut)) {
      this.startFadeIn();
    }
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);

    if (this.isFadingIn && this.getOpacity() >= 1) {
      this.isFadingIn = false;
    }

    if (this.isFadingOut && this.getOpacity() <= 0) {
      this.isFadingOut = false;
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

    const context = this.getCanvasContext();
    const previousFont = context.font;
    context.font = `${this.fontSize}px system-ui`;

    const maxWidth = this.actions.reduce((acc, action) => {
      const text = this.getTextParts(action)
        .map((part) => part.text)
        .join("");
      return Math.max(acc, context.measureText(text).width);
    }, 0);

    context.font = previousFont;

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
    switch (action.getType()) {
      case MatchActionType.Goal: {
        const scorerId = action.getScorerId();
        const playerName = this.getPlayerName(scorerId);
        const playerColor = this.getPlayerColor(scorerId);

        return [
          { text: playerName, color: playerColor },
          { text: " ⚽️ scored!", color: "white" },
        ];
      }
      case MatchActionType.Demolition: {
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
      case MatchActionType.PlayerJoined: {
        const playerId = action.getScorerId();
        const playerName = this.getPlayerName(playerId);
        const playerColor = this.getPlayerColor(playerId);

        return [
          { text: playerName, color: playerColor },
          { text: " 🤝 joined the match", color: "white" },
        ];
      }
      case MatchActionType.PlayerLeft: {
        const playerId = action.getScorerId();
        const playerName = this.getPlayerName(playerId);
        const playerColor = this.getPlayerColor(playerId);

        return [
          { text: playerName, color: playerColor },
          { text: " 👋 left the match", color: "white" },
        ];
      }
      case MatchActionType.ChatCommand: {
        const playerId = action.getScorerId();
        const playerName = this.getPlayerName(playerId);
        const playerColor = this.getPlayerColor(playerId);
        const commandName = action.getCommandName() ?? "command";
        const emoji = this.getCommandEmoji(commandName);

        return [
          { text: playerName, color: playerColor },
          { text: ` ${emoji} used /${commandName}`, color: "white" },
        ];
      }
      default:
        return [];
    }
  }

  private getCommandEmoji(commandName: string): string {
    switch (commandName) {
      case "rainbow":
        return "🌈";
      default:
        return "✨";
    }
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
    const team = this.getPlayerTeam(playerId);
    return this.getTeamColor(team);
  }

  private getPlayerTeam(playerId: string | null): TeamType | null {
    if (!playerId) {
      return null;
    }

    const localPlayer = this.gameState.getGamePlayer();
    if (playerId === localPlayer.getNetworkId()) {
      return TeamType.Blue;
    }

    const match = this.gameState.getMatch();
    const player = match?.getPlayerByNetworkId(playerId) ?? null;

    if (player === localPlayer) {
      return TeamType.Blue;
    }

    return TeamType.Red;
  }

  private getTeamColor(team: TeamType | null): string {
    switch (team) {
      case TeamType.Blue:
        return "#2196f3";
      case TeamType.Red:
        return "#ff4d4d";
      default:
        return "white";
    }
  }

  private startFadeIn(): void {
    this.isFadingOut = false;
    this.isFadingIn = true;
    this.animationTasks.length = 0;
    this.fadeIn(0.2);
  }

  private startFadeOut(): void {
    this.isFadingIn = false;
    this.isFadingOut = true;
    this.animationTasks.length = 0;
    this.fadeOut(0.2);
  }

  private getCanvasContext(): CanvasRenderingContext2D {
    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context not available");
    }
    return context;
  }
}
