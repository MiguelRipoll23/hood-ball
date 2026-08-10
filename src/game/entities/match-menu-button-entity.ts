import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { HelpEntity } from "./help-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";

export class MatchMenuButtonEntity extends BaseGameEntity {
  private readonly SIZE = 32;
  private readonly OFFSET = 20;
  private prevButtonPressed = false;
  private menuVisible = false;
  private onToggleMenu: (() => void) | null = null;

  constructor(
    private readonly boostMeterEntity: BoostMeterEntity,
    private readonly helpEntity: HelpEntity,
  ) {
    super();
    const inp = this.addComponent(new InputComponent());
    const t = this.addComponent(new TransformComponent());
    t.width = this.SIZE; t.height = this.SIZE;
    this.opacity = 0.7;
    t.x = this.boostMeterEntity.getX() - this.OFFSET - this.SIZE;
    t.y = this.boostMeterEntity.getY() + this.boostMeterEntity.getHeight() / 2 - this.SIZE / 2;

    const _s = this;
    this.addComponent(new ScriptComponent({
      update: () => { if (inp.pressed && !_s.prevButtonPressed && _s.onToggleMenu) _s.onToggleMenu(); _s.prevButtonPressed = inp.pressed; },
      render: (ctx) => {
        if (_s.menuVisible || _s.helpEntity.getOpacity() > 0) return;
        ctx.save(); if (ctx.globalAlpha > _s.opacity) ctx.globalAlpha = _s.opacity;
        ctx.font = `${_s.SIZE}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("\uD83C\uDF54", t.x + _s.SIZE / 2, t.y + _s.SIZE / 2 + 1);
        ctx.restore();
      },
    }));
  }

  public setOnToggleMenu(c: () => void): void { this.onToggleMenu = c; }
  public setMenuVisible(v: boolean): void { this.menuVisible = v; }
}
