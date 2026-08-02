import { BaseGameScene } from "../../../engine/scenes/base-game-scene.js";
import { GameState } from "../../../engine/models/game-state.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { SceneType } from "../../../engine/enums/scene-type.js";
import { container } from "../../../engine/services/di-container.js";

export class ErrorScene extends BaseGameScene {
  private readonly MESSAGE_WIDTH = 340;
  private readonly MESSAGE_HEIGHT = 100;
  private readonly CORNER_RADIUS = 6;

  private errorMessage: string;
  private messageX = 0;
  private messageY = 0;
  private messageTextX = 0;
  private messageTextY = 0;

  constructor(errorMessage: string) {
    const gameState = container.get(GameState);
    const eventConsumerService = container.get(EventConsumerService);
    super(gameState, eventConsumerService);
    this.errorMessage = errorMessage;
  }

  public override getTypeId(): SceneType {
    return SceneType.Error;
  }

  public override load(): void {
    this.calculateLayout();
    this.loaded = true;
  }

  public override update(_deltaTimeStamp: DOMHighResTimeStamp): void {
    // All user interactions are disabled — do not process pointer events or entities
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    context.globalAlpha = this.opacity;

    this.renderBackground(context);
    this.renderMessage(context);

    context.restore();
  }

  private calculateLayout(): void {
    this.messageX = this.canvas.width / 2 - this.MESSAGE_WIDTH / 2;
    this.messageY = this.canvas.height / 2 - this.MESSAGE_HEIGHT / 2;
    this.messageTextX = this.canvas.width / 2;
    this.messageTextY = this.messageY + this.MESSAGE_HEIGHT / 2 + 5;
  }

  private renderBackground(context: CanvasRenderingContext2D): void {
    const gradient = context.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#c0392b");
    gradient.addColorStop(1, "#7b241c");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderMessage(context: CanvasRenderingContext2D): void {
    const r = this.CORNER_RADIUS;
    const x = this.messageX;
    const y = this.messageY;
    const w = this.MESSAGE_WIDTH;
    const h = this.MESSAGE_HEIGHT;

    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
    context.fill();

    context.font = "16px Arial";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.errorMessage, this.messageTextX, this.messageTextY - 5);
  }
}
