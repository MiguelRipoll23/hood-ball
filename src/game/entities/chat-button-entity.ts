import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { ChatService } from "../services/network/chat-service.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import type { GameKeyboardContract } from "../../engine/interfaces/input/game-keyboard-interface.js";
import { HelpEntity } from "./help-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { InputComponent } from "../../engine/components/input-component.js";

export class ChatButtonEntity extends BaseGameEntity {
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
    this.addComponent(new InputComponent());
    this.addComponent(new TransformComponent());
    this.addComponent(new ScriptComponent({ update: (dt) => this.scriptUpdate(dt), render: (ctx) => this.scriptRender(ctx) }));
    this.getComponent(TransformComponent)!.width = this.SIZE;
    this.getComponent(TransformComponent)!.height = this.SIZE;
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
    void this.inputElement.offsetWidth;
    this.inputElement.classList.add("show");
    this.inputElement.value = "";
    this.inputElement.focus();
    this.gamePointer.setPreventDefault(false);
    this.inputVisible = true;
    this.getComponent(InputComponent)!.active = false;
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
    this.getComponent(InputComponent)!.active = true;
  }

  private setPosition(): void {
    this.getComponent(TransformComponent)!.x =
      this.boostMeterEntity.getX() +
      this.boostMeterEntity.getWidth() +
      this.OFFSET;
    this.getComponent(TransformComponent)!.y =
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

  private scriptUpdate(_delta: DOMHighResTimeStamp): void {
    // Only show input on a new button press (not just hover/held)
    if (this.getComponent(InputComponent)!.pressed && !this.prevButtonPressed && !this.inputVisible) {
      this.showInput();
    }

    if (this.inputVisible) {
      this.handleKeyboardInput();
    }

    this.prevButtonPressed = this.getComponent(InputComponent)!.pressed;
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
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
      this.getComponent(TransformComponent)!.x + this.SIZE / 2,
      this.getComponent(TransformComponent)!.y + this.SIZE / 2 + 1
    );
    context.restore();
  }
}
