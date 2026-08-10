import { BaseGameEntity } from "./base-game-entity.js";
import { TransformComponent } from "../components/transform-component.js";
import { ScriptComponent } from "../components/script-component.js";

const LIGHT_GREEN_COLOR = "#90EE90";

export class LoadingIndicatorEntity extends BaseGameEntity {
  private readonly SIZE = 20;
  private readonly MARGIN = 20;
  private readonly SPEED = 0.005;
  private visible = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    const t = this.addComponent(new TransformComponent());
    const _s = this;
    this.addComponent(new ScriptComponent({
      update: (dt) => {
        t.x = _s.MARGIN;
        t.y = _s.canvas.height - _s.SIZE - _s.MARGIN;
        if (_s.visible) t.angle += dt * _s.SPEED;
      },
      render: (ctx) => {
        if (!_s.visible) return;
        ctx.save();
        ctx.translate(t.x + _s.SIZE / 2, t.y + _s.SIZE / 2);
        ctx.rotate(t.angle);
        ctx.translate(-(t.x + _s.SIZE / 2), -(t.y + _s.SIZE / 2));
        ctx.strokeStyle = LIGHT_GREEN_COLOR;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x + _s.SIZE / 2, t.y + _s.SIZE / 2, _s.SIZE / 2, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
      },
    }));
  }

  public show(): void { this.visible = true; }
  public hide(): void { this.visible = false; }
}
