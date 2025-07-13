import { BaseTappableGameEntity } from "../../core/entities/base-tappable-game-entity.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { ChatService } from "../services/network/chat-service.js";
import { GamePointer } from "../../core/models/game-pointer.js";
import { GameKeyboard } from "../../core/models/game-keyboard.js";
import { HelpEntity } from "./help-entity.js";

export class ChatButtonEntity extends BaseTappableGameEntity {
  private readonly SIZE = 32;
  private readonly OFFSET = 20;
  private readonly emoji = "\uD83D\uDCAC"; // chat emoji

  private inputVisible = false;
  private prevEnterPressed = false;
  private prevEscapePressed = false;

  constructor(
    private readonly boostMeterEntity: BoostMeterEntity,
    private readonly inputElement: HTMLInputElement,
    private readonly chatService: ChatService,
    private readonly gamePointer: GamePointer,
    private readonly gameKeyboard: GameKeyboard,
    private readonly helpEntity: HelpEntity
  ) {
    super();
    this.width = this.SIZE;
    this.height = this.SIZE;
    this.opacity = 0.7;
    this.setActive(false);
    this.inputElement.addEventListener("blur", () => {
      if (!this.inputVisible) {
        return;
      }

      const text = this.inputElement.value.trim();
      if (text !== "") {
        this.chatService.sendMessage(text);
      }

      this.hideInput();
    });
  }

  private showInput(): void {
    if (this.helpEntity.getOpacity() > 0) {
      return;
    }

    this.inputElement.style.display = "block";
    this.inputElement.value = "";
    this.inputElement.focus();
    this.gamePointer.setPreventDefault(false);
    this.inputVisible = true;
    this.setActive(false);
  }

  private hideInput(): void {
    this.inputElement.blur();
    this.inputElement.style.display = "none";
    this.gamePointer.setPreventDefault(true);
    this.inputVisible = false;
    this.setActive(true);
  }

  private updatePosition(): void {
    this.x =
      this.boostMeterEntity.getX() +
      this.boostMeterEntity.getWidth() +
      this.OFFSET;
    this.y =
      this.boostMeterEntity.getY() +
      this.boostMeterEntity.getHeight() / 2 -
      this.SIZE / 2;
  }

  private handleKeyboardInput(): void {
    const pressedKeys = this.gameKeyboard.getPressedKeys();
    const enterPressed = pressedKeys.has("Enter");
    const escapePressed = pressedKeys.has("Escape");

    if (!this.prevEnterPressed && enterPressed) {
      this.hideInput();
    } else if (!this.prevEscapePressed && escapePressed) {
      this.hideInput();
    }

    this.prevEnterPressed = enterPressed;
    this.prevEscapePressed = escapePressed;
  }

  public override update(delta: DOMHighResTimeStamp): void {
    if (this.helpEntity.getOpacity() > 0) {
      if (!this.inputVisible) {
        this.setActive(false);
      }
    } else if (!this.inputVisible) {
      this.setActive(true);
    }

    this.updatePosition();

    if (this.pressed) {
      this.showInput();
    }

    if (this.inputVisible) {
      this.handleKeyboardInput();
    }

    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (this.inputVisible || this.helpEntity.getOpacity() > 0) {
      return;
    }

    context.save();
    this.applyOpacity(context);
    context.font = `${this.SIZE}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.emoji, this.x + this.SIZE / 2, this.y + this.SIZE / 2 + 1);
    context.restore();
    super.render(context);
  }
}
