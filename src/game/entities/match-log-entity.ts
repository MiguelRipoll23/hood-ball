import { BaseAnimatedGameEntity } from "../../engine/entities/base-animated-entity.js";
import { GameState } from "../../engine/models/game-state.js";
import { MatchAction } from "../models/match-action.js";
import { TeamType } from "../enums/team-type.js";
import { MatchActionType } from "../enums/match-action-type.js";
import { gameContext } from "../context/game-context.js";
import { GamePlayer } from "../models/game-player.js";
import { MatchSessionService } from "../services/session/match-session-service.js";

interface TextPart {
  text: string;
  color: string;
}

export class MatchLogEntity extends BaseAnimatedGameEntity {
  private readonly padding = 10;
  private readonly cornerRadius = 8;
  private readonly fontSize = 16;
  private readonly lineHeight = 16;
  private readonly actionMargin = 4;
  private readonly maxActions = 5;
  private readonly defaultActionOpacity = 1;
  private readonly fadeInDurationSeconds = 0.2;
  private readonly fallbackFadeOutDurationSeconds = 0.2;

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

    const hasActiveActions = this.actions.some(
      (action) => !action.isFadingOut()
    );

    if (hasActiveActions) {
      if (!this.isFadingIn && (this.opacity < 1 || this.isFadingOut)) {
        this.startFadeIn();
      }
      return;
    }

    const lastAction = this.actions[this.actions.length - 1];

    if (
      lastAction.isFadingOut() &&
      !this.isFadingOut &&
      this.getOpacity() > 0
    ) {
      const fadeDurationMs = lastAction.getFadeOutDurationMs();
      const fadeStartTimestamp = lastAction.getFadeOutStartTimestamp();

      let remainingSeconds = this.fallbackFadeOutDurationSeconds;

      if (fadeStartTimestamp !== null && fadeDurationMs > 0) {
        const elapsedMs = Date.now() - fadeStartTimestamp;
        const remainingMs = Math.max(0, fadeDurationMs - elapsedMs);

        if (remainingMs > 0) {
          remainingSeconds = remainingMs / 1000;
        }
      }

      this.startFadeOut(remainingSeconds);
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

      const previousAlpha = ctx.globalAlpha;
      const actionOpacity = this.getActionOpacity(action);
      ctx.globalAlpha = previousAlpha * actionOpacity;

      for (const part of parts) {
        ctx.fillStyle = part.color;
        ctx.fillText(part.text, x, y);
        x += ctx.measureText(part.text).width;
      }

      ctx.globalAlpha = previousAlpha;

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
        const playerName =
          action.getScorerName() ?? this.getPlayerName(scorerId);
        const playerColor = this.getPlayerColor(scorerId);

        return [
          { text: playerName, color: playerColor },
          { text: " ⚽️ scored!", color: "white" },
        ];
      }
      case MatchActionType.Demolition: {
        const attackerId = action.getAttackerId();
        const victimId = action.getVictimId();
        const attackerName =
          action.getAttackerName() ?? this.getPlayerName(attackerId);
        const victimName =
          action.getVictimName() ?? this.getPlayerName(victimId);
        const attackerColor = this.getPlayerColor(attackerId);
        const victimColor = this.getPlayerColor(victimId);

        return [
          { text: attackerName, color: attackerColor },
          { text: " 💣 destroyed ", color: "white" },
          { text: victimName, color: victimColor },
        ];
      }
      case MatchActionType.PlayerJoined: {
        const playerId = action.getActorId();
        const playerName =
          action.getActorName() ?? this.getPlayerName(playerId);
        const playerColor = this.getPlayerColor(playerId);

        return [
          { text: playerName, color: playerColor },
          { text: " 🤝 joined the match", color: "white" },
        ];
      }
      case MatchActionType.PlayerLeft: {
        const playerId = action.getActorId();
        const playerName =
          action.getActorName() ?? this.getPlayerName(playerId);
        const playerColor = this.getPlayerColor(playerId);

        return [
          { text: playerName, color: playerColor },
          { text: " 👋 left the match", color: "white" },
        ];
      }
      case MatchActionType.ChatCommand: {
        const playerId = action.getActorId();
        const playerName =
          action.getActorName() ?? this.getPlayerName(playerId);
        const playerColor = this.getPlayerColor(playerId);
        const commandName = action.getCommandName() ?? "command";

        return [
          { text: playerName, color: playerColor },
          { text: ` ✨ used /${commandName}`, color: "white" },
        ];
      }
      case MatchActionType.ChatMessage: {
        const playerId = action.getActorId();
        const playerName =
          action.getActorName() ?? this.getPlayerName(playerId);
        const playerColor = this.getPlayerColor(playerId);
        const messageText = action.getMessageText() ?? "";

        return [
          { text: `${playerName}: `, color: playerColor },
          { text: messageText, color: "white" },
        ];
      }
      default:
        return [{ text: "Unknown action", color: "white" }];
    }
  }

  private getPlayerName(playerId: string | null): string {
    if (!playerId) {
      return "Unknown";
    }

    const match = gameContext.get(MatchSessionService).getMatch();
    const player = match?.getPlayerByNetworkId(playerId) ?? null;

    if (player) {
      return player.getName();
    }

    const localPlayer = gameContext.get(GamePlayer);
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

    const localPlayer = gameContext.get(GamePlayer);
    if (playerId === localPlayer.getNetworkId()) {
      return TeamType.Blue;
    }

    const match = gameContext.get(MatchSessionService).getMatch();
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

  private getActionOpacity(action: MatchAction): number {
    if (!action.isFadingOut()) {
      return this.defaultActionOpacity;
    }

    const fadeStart = action.getFadeOutStartTimestamp();
    const fadeDuration = action.getFadeOutDurationMs();

    if (!fadeStart || fadeDuration <= 0) {
      return 0;
    }

    const elapsed = Date.now() - fadeStart;

    if (elapsed <= 0) {
      return this.defaultActionOpacity;
    }

    if (elapsed >= fadeDuration) {
      return 0;
    }

    const remaining = Math.max(fadeDuration - elapsed, 0);
    return Math.max(remaining / fadeDuration, 0);
  }

  private startFadeIn(): void {
    this.isFadingOut = false;
    this.isFadingIn = true;
    this.animationTasks.length = 0;
    this.fadeIn(this.fadeInDurationSeconds);
  }

  private startFadeOut(durationSeconds?: number): void {
    this.isFadingIn = false;
    this.isFadingOut = true;
    this.animationTasks.length = 0;
    const fadeDuration =
      durationSeconds !== undefined && durationSeconds > 0
        ? durationSeconds
        : this.fallbackFadeOutDurationSeconds;
    this.fadeOut(fadeDuration);
  }

  private getCanvasContext(): CanvasRenderingContext2D {
    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context not available");
    }
    return context;
  }
}
