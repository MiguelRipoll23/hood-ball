import { BaseTappableGameEntity } from "../../core/entities/base-tappable-game-entity.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { ChatService } from "../services/network/chat-service.js";
import { GamePointer } from "../../core/models/game-pointer.js";
import { GameKeyboard } from "../../core/models/game-keyboard.js";

export class ChatButtonEntity extends BaseTappableGameEntity {
  private readonly SIZE = 32;
  private readonly OFFSET = 10;
  private readonly emoji = "\u2328\uFE0F"; // keyboard emoji

  private inputVisible = false;
  private prevEnterPressed = false;
  private prevEscapePressed = false;

  constructor(
    private readonly boostMeterEntity: BoostMeterEntity,
    private readonly inputElement: HTMLInputElement,
    private readonly chatService: ChatService,
    private readonly gamePointer: GamePointer,
    private readonly gameKeyboard: GameKeyboard
  ) {
    super();
    this.width = this.SIZE;
    this.height = this.SIZE;
  }

  private showInput(): void {
    this.inputElement.style.display = "block";
    this.inputElement.value = "";
    this.inputElement.focus();
    this.gamePointer.setPreventDefault(false);
    this.inputVisible = true;
  }

  private hideInput(): void {
    this.inputElement.blur();
    this.inputElement.style.display = "none";
    this.gamePointer.setPreventDefault(true);
    this.inputVisible = false;
  }

  public override update(delta: DOMHighResTimeStamp): void {
    const x =
      this.boostMeterEntity.getX() +
      this.boostMeterEntity.getWidth() +
      this.OFFSET;
    const y =
      this.boostMeterEntity.getY() +
      this.boostMeterEntity.getHeight() / 2 -
      this.SIZE / 2;
    this.x = x;
    this.y = y;

    if (this.pressed) {
      this.showInput();
    }

    if (this.inputVisible) {
      const pressedKeys = this.gameKeyboard.getPressedKeys();
      const enterPressed = pressedKeys.has("Enter");
      const escapePressed = pressedKeys.has("Escape");

      if (!this.prevEnterPressed && enterPressed) {
        const text = this.inputElement.value.trim();
        if (text !== "") {
          this.chatService.sendMessage(text);
        }
        this.hideInput();
      } else if (!this.prevEscapePressed && escapePressed) {
        this.hideInput();
      }

      this.prevEnterPressed = enterPressed;
      this.prevEscapePressed = escapePressed;
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
