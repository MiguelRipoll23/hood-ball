import { BaseGameEntity } from "./base-game-entity.js";
import { TransformComponent } from "../components/transform-component.js";
import { AnimationComponent } from "../components/animation-component.js";
import { ScriptComponent } from "../components/script-component.js";

export class NotificationEntity extends BaseGameEntity {
  private readonly HEIGHT = 35;
  private readonly Y_MARGIN = 20;
  private readonly TEXT_SPEED = 2;
  private context: CanvasRenderingContext2D;
  private _nactive = false;
  private textX = 0;
  private completedTimes = 0;
  private _ny = 0;
  private text = "Whoops! Something went wrong!";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    this.addComponent(new TransformComponent());
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this._ny = this.Y_MARGIN;
    this.textX = this.canvas.width;
    this.opacity = 0;

    const _s = this;
    this.addComponent(new ScriptComponent({
      update: () => {
        if (!_s._nactive || _s.animationTasks.length > 0) return;
        _s.textX -= _s.TEXT_SPEED;
        const tw = _s.context.measureText(_s.text).width;
        if (_s.textX < -tw) {
          _s.completedTimes++;
          _s.textX = _s.canvas.width + tw;
          if (_s.completedTimes === 2) {
            anim.moveToY(-_s.HEIGHT, 0.2);
            anim.fadeOut(0.4);
            _s._nactive = false;
          }
        }
      },
      render: (ctx) => {
        ctx.save();
        if (ctx.globalAlpha > _s.opacity) ctx.globalAlpha = _s.opacity;
        ctx.fillStyle = "rgba(255, 0, 0, 0.85)";
        ctx.fillRect(_s.getComponent(TransformComponent)!.x, _s._ny, _s.canvas.width, 1);
        ctx.fillRect(_s.getComponent(TransformComponent)!.x, _s._ny + _s.HEIGHT - 1, _s.canvas.width, 1);
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(_s.getComponent(TransformComponent)!.x, _s._ny + 1, _s.canvas.width, _s.HEIGHT - 2);
        ctx.fillStyle = "#FFF";
        ctx.font = "20px system-ui";
        ctx.fillText(_s.text, _s.textX, _s._ny + _s.HEIGHT / 2 + 6);
        ctx.restore();
      },
    }));
  }

  public show(text: string): void {
    this.text = text; this._ny = 0; this.completedTimes = 0;
    this.textX = this.canvas.width + this.context.measureText(this.text).width;
    this._nactive = true; this.opacity = 0;
    this.getComponent(AnimationComponent)!.moveToY(this.Y_MARGIN, 0.2);
    this.getComponent(AnimationComponent)!.fadeIn(0.4);
  }
}
