import { LIGHT_GREEN_COLOR } from "../../constants/colors-constants.js";
import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { BackdropEntity } from "./backdrop-entity.js";
import { formatDate } from "../../../engine/utils/time-utils.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";
import { AnimationComponent } from "../../../engine/components/animation-component.js";

export class CloseableWindowEntity extends BaseGameEntity {
  private readonly TITLE_BAR_HEIGHT: number = 40;
  private readonly TEXT_LINE_HEIGHT: number = 20;
  private readonly EMPHASIS_COLOR: string = "#4a9c0f";
  private readonly NORMAL_TEXT_COLOR: string = "#000000";
  private readonly NORMAL_FONT: string = "16px system-ui";

  private readonly backdropEntity: BackdropEntity;

  private titleBarText: string = "SERVER MESSAGE";
  private titleBarTextX: number = 0;
  private titleBarTextY: number = 0;

  private titleTextX: number = 0;
  private titleTextY: number = 0;

  private formattedDateTextX: number = 0;
  private formattedDateTextY: number = 0;

  private contentTextX: number = 0;
  private contentTextY: number = 0;
  private contentTextMaxWidth: number = 0;

  protected title: string = "Title";
  protected content: string = "Content goes here";
  protected timestamp: number | null = null;

  private opened: boolean = false;

  constructor(private canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new AnimationComponent());
    this.addComponent(new InputComponent());
    this.addComponent(new TransformComponent());
    this.addComponent(new ScriptComponent({ update: (dt) => this.scriptUpdate(dt), render: (ctx) => this.scriptRender(ctx) }));
    this.backdropEntity = new BackdropEntity(this.canvas);
    this.setInitialState();
  }

  public override load(): void {
    this.backdropEntity.load();
    super.load();
  }

  public isOpened(): boolean {
    return this.opened;
  }

  public isClosed(): boolean {
    return this.opened === false;
  }

  public open(
    titleBarText: string,
    title: string,
    content: string,
    timestamp?: number
  ): void {
    if (this.opened === false) {
      this.getComponent(AnimationComponent)!.fadeIn(0.2);
    }

    this.opened = true;
    this.titleBarText = titleBarText;
    this.title = title;
    this.content = content;
    this.timestamp = timestamp ?? null;
    this.getComponent(InputComponent)!.active = true;
  }

  public close(): void {
    if (this.opened === false) {
      EngineLogger.warn("CloseableWindowEntity", "CloseableWindowEntity is already closed");
      return;
    }

    this.getComponent(AnimationComponent)!.fadeOut(0.2);

    this.opened = false;
    this.getComponent(InputComponent)!.active = false;
  }

  private scriptUpdate(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.getComponent(InputComponent)!.pressed) {
      this.close();
    }

    this.backdropEntity.update(deltaTimeStamp);

    super.update(deltaTimeStamp);
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
    context.save();

    this.applyOpacity(context);

    this.backdropEntity.render(context);
    this.renderWindow(context);

    context.restore();

    super.render(context);
  }

  private setInitialState(): void {
    this.opacity = 0;
    this.getComponent(InputComponent)!.active = false;
    this.setSize();
    this.setCenterPosition();
    this.calculatePositions();
  }

  private setSize(): void {
    this.getComponent(TransformComponent)!.width = this.canvas.width;
    this.getComponent(TransformComponent)!.height = this.canvas.height;
    this.getComponent(TransformComponent)!.width = this.canvas.width * 0.9;
    this.getComponent(TransformComponent)!.height = 300;
  }

  private setCenterPosition(): void {
    this.getComponent(TransformComponent)!.x = (this.canvas.width - this.getComponent(TransformComponent)!.width) / 2;
    this.getComponent(TransformComponent)!.y = (this.canvas.height - this.getComponent(TransformComponent)!.height) / 2;
  }

  private calculatePositions(): void {
    this.titleBarTextX = this.getComponent(TransformComponent)!.x + 15;
    this.titleBarTextY = this.getComponent(TransformComponent)!.y + 28;

    this.titleTextX = this.getComponent(TransformComponent)!.x + 14;
    this.titleTextY = this.getComponent(TransformComponent)!.y + 68; // More top padding from title bar

    this.formattedDateTextX = this.getComponent(TransformComponent)!.x + 14;
    this.formattedDateTextY = this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height - 14; // Bottom left of window

    this.contentTextX = this.getComponent(TransformComponent)!.x + 14;
    this.contentTextY = this.getComponent(TransformComponent)!.y + this.TITLE_BAR_HEIGHT + 55; // Reduced top margin
    this.contentTextMaxWidth = this.getComponent(TransformComponent)!.width - 25;
  }

  private wrapText(
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const lines: string[] = [];
    if (!text) {
      return lines;
    }

    // Normalize spaces and split into words
    const words = text.trim().split(/ +/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (this.calculateFormattedTextWidth(context, testLine) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private calculateFormattedTextWidth(
    context: CanvasRenderingContext2D,
    text: string
  ): number {
    let totalWidth = 0;
    const originalFont = context.font;
    const parts = text.split(/(<em>.*?<\/em>)/);

    for (const part of parts) {
      if (!part) continue;

      if (part.startsWith("<em>") && part.endsWith("</em>")) {
        const emText = part.substring(4, part.length - 5);
        context.font = this.NORMAL_FONT;
        totalWidth += context.measureText(emText).width;
      } else {
        context.font = this.NORMAL_FONT;
        totalWidth += context.measureText(part).width;
      }
    }
    context.font = originalFont;
    return totalWidth;
  }

  private renderWindow(context: CanvasRenderingContext2D): void {
    this.renderBackground(context);
    this.renderTitleBar(context);
    this.renderWindowTitle(context);
    this.renderTitle(context);
    this.renderContent(context);
    this.renderFormattedDate(context);
  }

  private renderBackground(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgb(255, 255, 255, 0.8)";
    context.fillRect(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, this.getComponent(TransformComponent)!.width, this.getComponent(TransformComponent)!.height);
  }

  private renderTitleBar(context: CanvasRenderingContext2D): void {
    context.fillStyle = LIGHT_GREEN_COLOR;
    context.fillRect(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, this.getComponent(TransformComponent)!.width, this.TITLE_BAR_HEIGHT);
  }

  private renderWindowTitle(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#FFFFFF";
    context.font = "20px system-ui";
    context.textAlign = "left";
    context.fillText(this.titleBarText, this.titleBarTextX, this.titleBarTextY);
  }

  private renderFormattedDate(context: CanvasRenderingContext2D): void {
    if (this.timestamp === null) {
      return;
    }

    const formattedDate = formatDate(this.timestamp);
    context.fillStyle = this.NORMAL_TEXT_COLOR;
    context.font = "16px system-ui";
    context.textAlign = "left";
    context.fillText(
      formattedDate,
      this.formattedDateTextX,
      this.formattedDateTextY
    );
  }

  private renderTitle(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.NORMAL_TEXT_COLOR;
    context.font = "20px system-ui";
    context.textAlign = "left";
    context.fillText(this.title, this.titleTextX, this.titleTextY);
  }

  private renderContent(context: CanvasRenderingContext2D): void {
    context.font = this.NORMAL_FONT;
    context.textAlign = "left";

    const lines = this.wrapText(
      context,
      this.content,
      this.contentTextMaxWidth
    );

    let currentY = this.contentTextY;

    for (const line of lines) {
      this.renderLineWithFormatting(context, line, this.contentTextX, currentY);
      currentY += this.TEXT_LINE_HEIGHT;
    }
  }

  private renderLineWithFormatting(
    context: CanvasRenderingContext2D,
    line: string,
    x: number,
    y: number
  ): void {
    let currentX = x;
    const originalFont = context.font;
    const parts = line.split(/(<em>.*?<\/em>)/);

    for (const part of parts) {
      if (!part) {
        continue;
      }

      if (part.startsWith("<em>") && part.endsWith("</em>")) {
        const text = part.substring(4, part.length - 5);
        context.fillStyle = this.EMPHASIS_COLOR;
        context.font = this.NORMAL_FONT;
        context.fillText(text, currentX, y);
        currentX += context.measureText(text).width;
      } else {
        context.fillStyle = this.NORMAL_TEXT_COLOR;
        context.font = this.NORMAL_FONT;
        context.fillText(part, currentX, y);
        currentX += context.measureText(part).width;
      }
    }
    context.font = originalFont;
  }
  public override update(deltaTimeStamp: DOMHighResTimeStamp): void { super.update(deltaTimeStamp); }
  public override render(context: CanvasRenderingContext2D): void { super.render(context); }
}
