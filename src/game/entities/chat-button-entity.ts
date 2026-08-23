import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { ChatService } from "../services/network/chat-service.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import type { GameKeyboardContract } from "../../engine/interfaces/input/game-keyboard-interface.js";
import { HelpEntity } from "./help-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { ChatButtonScript } from "../scripts/chat-button-script.js";

/**
 * Pure component container for the chat button. All DOM interaction,
 * input handling, and rendering lives in {@link ChatButtonScript}.
 */
export class ChatButtonEntity extends BaseGameEntity {
  private readonly script: ChatButtonScript;

  constructor(
    boostMeterEntity: BoostMeterEntity,
    inputElement: HTMLInputElement,
    chatService: ChatService,
    gamePointer: GamePointerContract,
    gameKeyboard: GameKeyboardContract,
    helpEntity: HelpEntity,
  ) {
    super();
    const input = this.addComponent(new InputComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new ChatButtonScript(
      boostMeterEntity, inputElement, chatService,
      gamePointer, gameKeyboard, helpEntity,
    );
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, input);
    this.script.init();
  }

  public isInputVisible(): boolean { return this.script.inputVisible; }
  public isActive(): boolean { return this.getComponent(InputComponent)!.active; }
  public isHovering(): boolean { return this.getComponent(InputComponent)!.hovering; }
  public isPressed(): boolean { return this.getComponent(InputComponent)!.pressed; }
  public handlePointerEvent(gp: import("../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract): void {
    this.getComponent(InputComponent)!.handlePointerEvent(gp);
  }
}
