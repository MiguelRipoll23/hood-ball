import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { OnlinePlayersScript } from "../scripts/online-players-script.js";

/**
 * Pure component container for the online-players counter. All animation
 * and rendering logic lives in {@link OnlinePlayersScript}.
 */
export class OnlinePlayersEntity extends BaseGameEntity {
  private readonly script: OnlinePlayersScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new AnimationComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new OnlinePlayersScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform);
    this.script.init();
  }

  public setOnlinePlayers(total: number): void {
    const prev = this.script.onlinePlayers;
    this.script.onlinePlayers = total;
    this.script.measureCountWidth();

    if (prev === 0 && total > 0) {
      this.setOpacity(0);
      this.getComponent(AnimationComponent)!.fadeIn(0.3);
      this.script.startBounce();
    } else if (total === 0) {
      this.setOpacity(0);
    } else if (prev !== total) {
      this.script.startShake();
    }
  }
}
