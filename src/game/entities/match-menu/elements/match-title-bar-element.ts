import { BaseGameEntity } from "../../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../../engine/components/script-component.js";

export class MatchTitleBarElement extends BaseGameEntity {
  private readonly BORDER_RADIUS = 12;
  private readonly TITLE = "Match menu";

  constructor(
    private _mx: number,
    private _my: number,
    private _mw: number,
    private readonly _h: number,
    private readonly padding: number
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
    this.renderBackground(context);
    this.renderTitle(context);
  }

  private renderBackground(context: CanvasRenderingContext2D): void {
    const radius = this.BORDER_RADIUS;

    context.save();
    context.beginPath();
    context.moveTo(this._mx + radius, this._my);
    context.lineTo(this._mx + this._mw - radius, this._my);
    context.quadraticCurveTo(
      this._mx + this._mw,
      this._my,
      this._mx + this._mw,
      this._my + radius
    );
    context.lineTo(this._mx + this._mw, this._my + this._h);
    context.lineTo(this._mx, this._my + this._h);
    context.lineTo(this._mx, this._my + radius);
    context.quadraticCurveTo(this._mx, this._my, this._mx + radius, this._my);
    context.closePath();
    context.clip();

    const gradient = context.createLinearGradient(
      this._mx,
      this._my,
      this._mx,
      this._my + this._h
    );
    gradient.addColorStop(0, "#4a90e2");
    gradient.addColorStop(1, "#357abd");

    context.fillStyle = gradient;
    context.fillRect(this._mx, this._my, this._mw, this._h);
    context.restore();
  }

  private renderTitle(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = "#ffffff";
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 2;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    context.font = "bold 24px system-ui";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(
      this.TITLE,
      this._mx + this.padding,
      this._my + this._h / 2 + 1
    );
    context.restore();
  }
}
