import { BaseTappableGameEntity } from "../../core/entities/base-tappable-game-entity.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { ChatService } from "../services/network/chat-service.js";
import { GamePointer } from "../../core/models/game-pointer.js";

export class ChatButtonEntity extends BaseTappableGameEntity {
  private readonly SIZE = 32;
  private readonly OFFSET = 10;
  private readonly emoji = "\u2328\uFE0F"; // keyboard emoji

  constructor(
    private readonly boostMeter: BoostMeterEntity,
    private readonly inputElement: HTMLInputElement,
    private readonly chatService: ChatService,
    private readonly gamePointer: GamePointer
  ) {
    super();
    this.width = this.SIZE;
    this.height = this.SIZE;
    this.addInputListeners();
  }

  private addInputListeners(): void {
    this.inputElement.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const text = this.inputElement.value.trim();
        if (text !== "") {
          this.chatService.sendMessage(text);
        }
        this.hideInput();
      } else if (e.key === "Escape") {
        this.hideInput();
      }
    });
  }

  private showInput(): void {
    this.inputElement.style.display = "block";
    this.inputElement.value = "";
    this.inputElement.focus();
    this.gamePointer.setPreventDefault(false);
  }

  private hideInput(): void {
    this.inputElement.blur();
    this.inputElement.style.display = "none";
    this.gamePointer.setPreventDefault(true);
  }

  public override update(delta: DOMHighResTimeStamp): void {
    const x =
      this.boostMeter.getX() + this.boostMeter.getWidth() + this.OFFSET;
    const y =
      this.boostMeter.getY() + this.boostMeter.getHeight() / 2 - this.SIZE / 2;
    this.x = x;
    this.y = y;

    if (this.pressed) {
      this.showInput();
    }

    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);
    context.font = `${this.SIZE * 0.8}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.emoji, this.x + this.SIZE / 2, this.y + this.SIZE / 2 + 1);
    context.restore();
    super.render(context);
  }
}
