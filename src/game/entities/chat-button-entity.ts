import { BaseTappableGameEntity } from "../../engine/entities/base-tappable-game-entity.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { ChatService } from "../services/network/chat-service.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import type { GameKeyboardContract } from "../../engine/interfaces/input/game-keyboard-interface.js";
import { HelpEntity } from "./help-entity.js";

export class ChatButtonEntity extends BaseTappableGameEntity {
  private readonly SIZE = 32;
  private readonly OFFSET = 20;
  private readonly emoji = "\uD83D\uDCAC"; // chat emoji
  private readonly DEFAULT_OPACITY = 0.7;
  private readonly HIDE_COOLDOWN_MS = 500; // Prevent immediate reopen after hiding

  private inputVisible = false;
  private prevEnterPressed = false;
  private prevEscapePressed = false;
  private lastHideTimestamp = 0;
  private prevButtonPressed = false;

  constructor(
    private readonly boostMeterEntity: BoostMeterEntity,
    private readonly inputElement: HTMLInputElement,
    private readonly chatService: ChatService,
    private readonly gamePointer: GamePointerContract,
    private readonly gameKeyboard: GameKeyboardContract,
    private readonly helpEntity: HelpEntity
  ) {
    super();
    this.width = this.SIZE;
    this.height = this.SIZE;
    this.opacity = this.DEFAULT_OPACITY;
    this.setPosition();
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

    // Prevent reopening if we just hid it (cooldown period)
    if (Date.now() - this.lastHideTimestamp < this.HIDE_COOLDOWN_MS) {
      return;
    }

    this.inputElement.style.display = "block";
    // Trigger reflow to ensure the transition runs
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.inputElement.offsetWidth;
    this.inputElement.classList.add("show");
    this.inputElement.value = "";
    this.inputElement.focus();
    this.gamePointer.setPreventDefault(false);
    this.inputVisible = true;
    this.setActive(false);
  }

  private hideInput(): void {
    this.inputElement.blur();
    this.inputElement.classList.remove("show");

    this.inputElement.addEventListener(
      "transitionend",
      () => {
        this.inputElement.style.display = "none";
      },
      { once: true }
    );

    this.gamePointer.setPreventDefault(true);
    this.inputVisible = false;
    this.lastHideTimestamp = Date.now();
    this.setActive(true);
  }

  private setPosition(): void {
    this.x =
      this.boostMeterEntity.getX() +
      this.boostMeterEntity.getWidth() +
      this.OFFSET;
    this.y =
      this.boostMeterEntity.getY() +
      this.boostMeterEntity.getHeight() / 2 -
      this.SIZE / 2;
  }

  public isInputVisible(): boolean {
    return this.inputVisible;
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
    // Only show input on a new button press (not just hover/held)
    if (this.pressed && !this.prevButtonPressed && !this.inputVisible) {
      this.showInput();
    }

    if (this.inputVisible) {
      this.handleKeyboardInput();
    }

    this.prevButtonPressed = this.pressed;
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
    context.fillText(
      this.emoji,
      this.x + this.SIZE / 2,
      this.y + this.SIZE / 2 + 1
    );
    context.restore();
    super.render(context);
  }
}
