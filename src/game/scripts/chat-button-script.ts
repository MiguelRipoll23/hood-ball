import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";
import type { BoostMeterEntity } from "../entities/boost-meter-entity.js";
import type { ChatService } from "../services/network/chat-service.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import type { GameKeyboardContract } from "../../engine/interfaces/input/game-keyboard-interface.js";
import type { HelpEntity } from "../entities/help-entity.js";

const SIZE = 32;
const OFFSET = 20;
const EMOJI = "\uD83D\uDCAC";
const DEFAULT_OPACITY = 0.7;
const HIDE_COOLDOWN_MS = 500;

/**
 * Script behaviour for the chat toggle button. Manages chat input DOM
 * element visibility, keyboard shortcuts (Enter/Escape), and renders
 * the chat emoji button.
 * Attached to ChatButtonEntity via ScriptComponent.
 */
export class ChatButtonScript implements ScriptLifecycle {
  inputVisible = false;
  private prevEnterPressed = false;
  private prevEscapePressed = false;
  private lastHideTimestamp = 0;
  private prevButtonPressed = false;

  private transform!: TransformComponent;
  private input!: InputComponent;

  private opacity = DEFAULT_OPACITY;

  constructor(
    private readonly boostMeterEntity: BoostMeterEntity,
    private readonly inputElement: HTMLInputElement,
    private readonly chatService: ChatService,
    private readonly gamePointer: GamePointerContract,
    private readonly gameKeyboard: GameKeyboardContract,
    private readonly helpEntity: HelpEntity,
  ) {}

  resolveComponents(
    transform: TransformComponent,
    input: InputComponent,
  ): void {
    this.transform = transform;
    this.input = input;
  }

  init(): void {
    this.transform.width = SIZE;
    this.transform.height = SIZE;
    this.setPosition();

    this.inputElement.addEventListener("blur", () => {
      if (!this.inputVisible) return;
      const text = this.inputElement.value.trim();
      if (text !== "") {
        this.chatService.sendMessage(text);
      }
      this.hideInput();
    });
  }

  update(_delta: DOMHighResTimeStamp): void {
    if (this.input.pressed && !this.prevButtonPressed && !this.inputVisible) {
      this.showInput();
    }

    if (this.inputVisible) {
      this.handleKeyboardInput();
    }

    this.prevButtonPressed = this.input.pressed;
  }

  render(context: CanvasRenderingContext2D): void {
    if (this.inputVisible || this.helpEntity.getOpacity() > 0) return;

    context.save();
    if (context.globalAlpha > this.opacity) {
      context.globalAlpha = this.opacity;
    }
    context.font = `${SIZE}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      EMOJI,
      this.transform.x + SIZE / 2,
      this.transform.y + SIZE / 2 + 1,
    );
    context.restore();
  }

  private setPosition(): void {
    this.transform.x =
      this.boostMeterEntity.getX() +
      this.boostMeterEntity.getWidth() +
      OFFSET;
    this.transform.y =
      this.boostMeterEntity.getY() +
      this.boostMeterEntity.getHeight() / 2 -
      SIZE / 2;
  }

  private showInput(): void {
    if (this.helpEntity.getOpacity() > 0) return;
    if (Date.now() - this.lastHideTimestamp < HIDE_COOLDOWN_MS) return;

    this.inputElement.style.display = "block";
    void this.inputElement.offsetWidth;
    this.inputElement.classList.add("show");
    this.inputElement.value = "";
    this.inputElement.focus();
    this.gamePointer.setPreventDefault(false);
    this.inputVisible = true;
    this.input.active = false;
  }

  private hideInput(): void {
    this.inputElement.blur();
    this.inputElement.classList.remove("show");

    this.inputElement.addEventListener(
      "transitionend",
      () => {
        this.inputElement.style.display = "none";
      },
      { once: true },
    );

    this.gamePointer.setPreventDefault(true);
    this.inputVisible = false;
    this.lastHideTimestamp = Date.now();
    this.input.active = true;
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
}
