import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { AnimationComponent } from "../../engine/components/animation-component.js";
import { MatchAction } from "../models/match-action.js";
import { TeamType } from "../enums/team-type.js";
import { MatchActionType } from "../enums/match-action-type.js";
import type { GamePlayer } from "../models/game-player.js";
import type { MatchSessionService } from "../services/session/match-session-service.js";

interface TextPart {
  text: string;
  color: string;
}

/**
 * Script behaviour for the match actions log. Renders recent match events
 * (goals, demolitions, joins, leaves, bans, chat) as colored text entries
 * with per-action fade-out support.
 * Attached to MatchLogEntity via ScriptComponent.
 */
export class MatchLogScript implements ScriptLifecycle {
  private readonly padding = 10;
  private readonly fontSize = 16;
  private readonly lineHeight = 16;
  private readonly actionMargin = 4;
  private readonly maxActions = 5;
  private readonly defaultActionOpacity = 1;
  private readonly fadeInDurationSeconds = 0.2;
  private readonly fallbackFadeOutDurationSeconds = 0.2;

  actions: MatchAction[] = [];
  private isFadingIn = false;
  private isFadingOut = false;

  private transform!: TransformComponent;
  private animation!: AnimationComponent;
  private canvas!: HTMLCanvasElement;

  constructor(
    private readonly matchSessionService: MatchSessionService,
    private readonly gamePlayer: GamePlayer,
  ) {}

  resolveComponents(
    canvas: HTMLCanvasElement,
    transform: TransformComponent,
    animation: AnimationComponent,
  ): void {
    this.canvas = canvas;
    this.transform = transform;
    this.animation = animation;
  }

  show(actions: MatchAction[], currentOpacity: number): void {
    this.actions = actions.slice(-this.maxActions);

    if (this.actions.length === 0) {
      this.transform.width = 0;
      this.transform.height = 0;
      if ((currentOpacity > 0 || this.isFadingIn) && !this.isFadingOut) {
        this.startFadeOut();
      }
      return;
    }

    this.measure();
    this.setPosition();

    const hasActiveActions = this.actions.some(
      (action) => !action.isFadingOut(),
    );

    if (hasActiveActions) {
      if (!this.isFadingIn && (currentOpacity < 1 || this.isFadingOut)) {
        this.startFadeIn();
      }
      return;
    }

    const lastAction = this.actions[this.actions.length - 1];

    if (lastAction.isFadingOut() && !this.isFadingOut && currentOpacity > 0) {
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

  update(_delta: DOMHighResTimeStamp): void {
    if (this.isFadingIn && this.animation.entity!.getOpacity() >= 1) {
      this.isFadingIn = false;
    }
    if (this.isFadingOut && this.animation.entity!.getOpacity() <= 0) {
      this.isFadingOut = false;
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (this.actions.length === 0) return;

    const entityOpacity = this.animation.entity?.getOpacity() ?? 1;
    if (entityOpacity === 0) return;

    context.save();
    if (context.globalAlpha > entityOpacity) {
      context.globalAlpha = entityOpacity;
    }
    this.drawText(context);
    context.restore();
  }

  private measure(): void {
    if (this.actions.length === 0) {
      this.transform.width = 0;
      this.transform.height = 0;
      return;
    }

    const ctx = this.canvas.getContext("2d")!;
    const previousFont = ctx.font;
    ctx.font = `${this.fontSize}px system-ui`;

    const maxWidth = this.actions.reduce((acc, action) => {
      const text = this.getTextParts(action)
        .map((part) => part.text)
        .join("");
      return Math.max(acc, ctx.measureText(text).width);
    }, 0);

    ctx.font = previousFont;

    this.transform.width = maxWidth + this.padding * 2;
    this.transform.height =
      this.actions.length * this.lineHeight +
      (this.actions.length - 1) * this.actionMargin +
      this.padding * 2;
  }

  private setPosition(): void {
    this.transform.x = 20;
    this.transform.y = 20;
  }

  private drawText(ctx: CanvasRenderingContext2D): void {
    ctx.font = `${this.fontSize}px system-ui`;
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const t = this.transform;
    let y = t.y + this.padding + this.lineHeight / 2;
    const baseX = t.x + this.padding;

    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      const parts = this.getTextParts(action);
      let x = baseX;

      const prevAlpha = ctx.globalAlpha;
      const actionOpacity = this.getActionOpacity(action);
      ctx.globalAlpha = prevAlpha * actionOpacity;

      for (const part of parts) {
        ctx.fillStyle = part.color;
        ctx.fillText(part.text, x, y);
        x += ctx.measureText(part.text).width;
      }

      ctx.globalAlpha = prevAlpha;
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
      case MatchActionType.PlayerBanned: {
        const playerId = action.getActorId();
        const playerName =
          action.getActorName() ?? this.getPlayerName(playerId);
        const playerColor = this.getPlayerColor(playerId);
        return [
          { text: playerName, color: playerColor },
          { text: " has been banned", color: "white" },
        ];
      }
      default:
        return [{ text: "Unknown action", color: "white" }];
    }
  }

  private getPlayerName(playerId: string | null): string {
    if (!playerId) return "Unknown";

    const match = this.matchSessionService.getMatch();
    const player = match?.getPlayerByNetworkId(playerId) ?? null;
    if (player) return player.getName();

    if (playerId === this.gamePlayer.getNetworkId()) {
      return this.gamePlayer.getName();
    }

    return playerId;
  }

  private getPlayerColor(playerId: string | null): string {
    const team = this.getPlayerTeam(playerId);
    return this.getTeamColor(team);
  }

  private getPlayerTeam(playerId: string | null): TeamType | null {
    if (!playerId) return null;
    if (playerId === this.gamePlayer.getNetworkId()) return TeamType.Blue;

    const match = this.matchSessionService.getMatch();
    const player = match?.getPlayerByNetworkId(playerId) ?? null;
    if (player === this.gamePlayer) return TeamType.Blue;
    return TeamType.Red;
  }

  private getTeamColor(team: TeamType | null): string {
    switch (team) {
      case TeamType.Blue: return "#2196f3";
      case TeamType.Red: return "#ff4d4d";
      default: return "white";
    }
  }

  private getActionOpacity(action: MatchAction): number {
    if (!action.isFadingOut()) return this.defaultActionOpacity;

    const fadeStart = action.getFadeOutStartTimestamp();
    const fadeDuration = action.getFadeOutDurationMs();
    if (!fadeStart || fadeDuration <= 0) return 0;

    const elapsed = Date.now() - fadeStart;
    if (elapsed <= 0) return this.defaultActionOpacity;
    if (elapsed >= fadeDuration) return 0;

    const remaining = Math.max(fadeDuration - elapsed, 0);
    return Math.max(remaining / fadeDuration, 0);
  }

  private startFadeIn(): void {
    this.isFadingOut = false;
    this.isFadingIn = true;
    this.animation.clearAnimations();
    this.animation.fadeIn(this.fadeInDurationSeconds);
  }

  private startFadeOut(durationSeconds?: number): void {
    this.isFadingIn = false;
    this.isFadingOut = true;
    this.animation.clearAnimations();
    const fadeDuration =
      durationSeconds !== undefined && durationSeconds > 0
        ? durationSeconds
        : this.fallbackFadeOutDurationSeconds;
    this.animation.fadeOut(fadeDuration);
  }
}
