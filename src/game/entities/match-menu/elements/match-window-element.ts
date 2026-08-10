import { BaseGameEntity } from "../../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../../engine/components/script-component.js";

export class MatchWindowElement extends BaseGameEntity {
  private readonly BORDER_RADIUS = 12;

  constructor(
    private _mx: number,
    private _my: number,
    private _mw: number,
    private readonly _h: number
  ) {
    super();
    this.addComponent(new ScriptComponent({ render: (ctx) => this.scriptRender(ctx) }));
  }

  public setLayout(x: number, y: number, width: number): void {
    this._mx = x;
    this._my = y;
    this._mw = width;
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
    context.shadowBlur = 20;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 10;

    context.fillStyle = "#ffffff";
    this.drawRoundedRect(
      context,
      this._mx,
      this._my,
      this._mw,
      this._h,
      this.BORDER_RADIUS
    );
    context.fill();

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  private drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }
}
