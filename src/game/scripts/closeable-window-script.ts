import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { AnimationComponent } from "../../engine/components/animation-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";
import { BackdropEntity } from "../entities/common/backdrop-entity.js";
import { formatDate } from "../../engine/utils/time-utils.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class CloseableWindowScript implements ScriptLifecycle {
  private readonly TITLE_BAR_HEIGHT = 40;
  private readonly TEXT_LINE_HEIGHT = 20;
  private readonly EMPHASIS_COLOR = "#4a9c0f";
  private readonly NORMAL_TEXT_COLOR = "#000000";
  private readonly NORMAL_FONT = "16px system-ui";

  private backdropEntity: BackdropEntity;
  opened = false;
  protected title = "Title";
  protected content = "Content goes here";
  protected timestamp: number | null = null;

  /**
   * Called when the input triggers a close. Set by the owning entity so
   * that subclasses can override close behaviour (e.g. server messages
   * set {@code next = true} instead of closing).
   */
  closeCallback?: () => void;

  private transform!: TransformComponent;
  private animation!: AnimationComponent;
  private input!: InputComponent;
  private canvas!: HTMLCanvasElement;

  private titleBarText = "SERVER MESSAGE";
  private titleBarTextX = 0; private titleBarTextY = 0;
  private titleTextX = 0; private titleTextY = 0;
  private formattedDateTextX = 0; private formattedDateTextY = 0;
  private contentTextX = 0; private contentTextY = 0;
  private contentTextMaxWidth = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.backdropEntity = new BackdropEntity(canvas);
  }

  resolveComponents(transform: TransformComponent, animation: AnimationComponent, input: InputComponent): void {
    this.transform = transform;
    this.animation = animation;
    this.input = input;
    this.transform.width = this.canvas.width * 0.9;
    this.transform.height = 300;
    this.setCenterPosition();
    this.calculatePositions();
  }

  load(): void { this.backdropEntity.load(); }

  open(titleBarText: string, title: string, content: string, timestamp?: number): void {
    if (!this.opened) this.animation.fadeIn(0.2);
    this.opened = true;
    this.titleBarText = titleBarText; this.title = title; this.content = content; this.timestamp = timestamp ?? null;
    this.input.active = true;
  }

  close(): void {
    if (!this.opened) return;
    this.animation.fadeOut(0.2);
    this.opened = false; this.input.active = false;
  }

  update(delta: DOMHighResTimeStamp): void {
    if (this.input.pressed) {
      if (this.closeCallback) {
        this.closeCallback();
      } else {
        this.close();
      }
    }
    this.backdropEntity.update(delta);
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    this.backdropEntity.render(context);
    this.renderWindow(context);
    context.restore();
  }

  private setCenterPosition(): void {
    this.transform.x = (this.canvas.width - this.transform.width) / 2;
    this.transform.y = (this.canvas.height - this.transform.height) / 2;
  }

  private calculatePositions(): void {
    const t = this.transform;
    this.titleBarTextX = t.x + 15; this.titleBarTextY = t.y + 28;
    this.titleTextX = t.x + 14; this.titleTextY = t.y + 68;
    this.formattedDateTextX = t.x + 14; this.formattedDateTextY = t.y + t.height - 14;
    this.contentTextX = t.x + 14; this.contentTextY = t.y + this.TITLE_BAR_HEIGHT + 55;
    this.contentTextMaxWidth = t.width - 25;
  }

  private renderWindow(ctx: CanvasRenderingContext2D): void {
    const t = this.transform;
    ctx.fillStyle = "rgb(255, 255, 255, 0.8)";
    ctx.fillRect(t.x, t.y, t.width, t.height);
    ctx.fillStyle = LIGHT_GREEN_COLOR;
    ctx.fillRect(t.x, t.y, t.width, this.TITLE_BAR_HEIGHT);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "20px system-ui"; ctx.textAlign = "left";
    ctx.fillText(this.titleBarText, this.titleBarTextX, this.titleBarTextY);
    ctx.fillStyle = this.NORMAL_TEXT_COLOR; ctx.font = "20px system-ui";
    ctx.fillText(this.title, this.titleTextX, this.titleTextY);
    if (this.timestamp !== null) {
      ctx.font = "16px system-ui"; ctx.fillText(formatDate(this.timestamp), this.formattedDateTextX, this.formattedDateTextY);
    }
    this.renderContent(ctx);
  }

  private renderContent(ctx: CanvasRenderingContext2D): void {
    ctx.font = this.NORMAL_FONT; ctx.textAlign = "left";
    const lines = this.wrapText(ctx, this.content, this.contentTextMaxWidth);
    let cy = this.contentTextY;
    for (const line of lines) { this.renderLineWithFormatting(ctx, line, this.contentTextX, cy); cy += this.TEXT_LINE_HEIGHT; }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
    if (!text) return [];
    const words = text.trim().split(/ +/); const lines: string[] = []; let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (this.calcFormattedWidth(ctx, test) <= maxW) cur = test;
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  private calcFormattedWidth(ctx: CanvasRenderingContext2D, text: string): number {
    const orig = ctx.font; let w = 0;
    const parts = text.split(/(<em>.*?<\/em>)/);
    for (const p of parts) {
      if (!p) continue;
      ctx.font = this.NORMAL_FONT;
      if (p.startsWith("<em>") && p.endsWith("</em>")) w += ctx.measureText(p.substring(4, p.length - 5)).width;
      else w += ctx.measureText(p).width;
    }
    ctx.font = orig; return w;
  }

  private renderLineWithFormatting(ctx: CanvasRenderingContext2D, line: string, x: number, y: number): void {
    const orig = ctx.font; let cx = x;
    const parts = line.split(/(<em>.*?<\/em>)/);
    for (const p of parts) {
      if (!p) continue;
      if (p.startsWith("<em>") && p.endsWith("</em>")) {
        ctx.fillStyle = this.EMPHASIS_COLOR; ctx.font = this.NORMAL_FONT;
        ctx.fillText(p.substring(4, p.length - 5), cx, y); cx += ctx.measureText(p.substring(4, p.length - 5)).width;
      } else { ctx.fillStyle = this.NORMAL_TEXT_COLOR; ctx.font = this.NORMAL_FONT; ctx.fillText(p, cx, y); cx += ctx.measureText(p).width; }
    }
    ctx.font = orig;
  }
}
