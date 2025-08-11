import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { TimerService } from "../../core/services/gameplay/timer-service.js";
import { ChatMessage } from "../models/chat-message.js";
import { GameState } from "../../core/models/game-state.js";

export class ChatHistoryEntity extends BaseAnimatedGameEntity {
  private readonly padding = 10;
  private readonly cornerRadius = 8;
  private readonly fontSize = 16;
  private readonly lineHeight = 16;
  private readonly messageMargin = 4;
  private messages: ChatMessage[] = [];
  private timer: TimerService | null = null;
  private context: CanvasRenderingContext2D;
  private localPlayerName = "";
  private gameState: GameState;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    gameState: GameState
  ) {
    super();
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.gameState = gameState;
    this.opacity = 0;
  }

  public show(messages: ChatMessage[], localPlayerName: string): void {
    this.messages = messages.slice(-5); // show last 5 messages
    this.localPlayerName = localPlayerName;
    this.measure();
    this.setPosition();
    this.timer?.stop(false);
    this.fadeIn(0.2);
    this.timer = new TimerService(3, this.hide.bind(this));
  }

  public hide(): void {
    this.fadeOut(0.2);
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.timer?.update(delta);
    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (this.opacity === 0) return;
    context.save();
    this.applyOpacity(context);
    this.drawBackground(context);
    this.drawText(context);
    context.restore();
  }

  private measure(): void {
    this.context.font = `${this.fontSize}px system-ui`;

    // Calculate width based on formatted messages
    const maxWidth = this.messages.reduce((acc, messageObj) => {
      const playerName = this.getPlayerName(messageObj.getUserId());
      const formattedMessage = `${playerName}: ${messageObj.getText()}`;
      return Math.max(acc, this.context.measureText(formattedMessage).width);
    }, 0);

    this.width = maxWidth + this.padding * 2;
    this.height =
      this.messages.length * this.lineHeight +
      (this.messages.length - 1) * this.messageMargin +
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
    const x = this.x + this.padding;

    for (let i = 0; i < this.messages.length; i++) {
      const message = this.messages[i];
      const playerName = this.getPlayerName(message.getUserId());
      const nameColor =
        playerName === this.localPlayerName ? "#2196f3" : "#ff4d4d";

      // Draw player name
      ctx.fillStyle = nameColor;
      const nameText = playerName + ":";
      ctx.fillText(nameText, x, y);

      // Calculate name width and draw message
      const nameWidth = ctx.measureText(nameText + " ").width;
      ctx.fillStyle = "white";
      ctx.fillText(message.getText(), x + nameWidth, y);

      y += this.lineHeight;
      if (i < this.messages.length - 1) {
        y += this.messageMargin;
      }
    }
  }

  private getPlayerName(userId: string): string {
    return (
      this.gameState.getMatch()?.getPlayerByNetworkId(userId)?.getName() ??
      userId
    );
  }
}
