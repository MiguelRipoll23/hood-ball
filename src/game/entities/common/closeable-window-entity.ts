import { LIGHT_GREEN_COLOR } from "../../constants/colors-constants.js";
import { BaseTappableGameEntity } from "../../../core/entities/base-tappable-game-entity.js";
import { BackdropEntity } from "./backdrop-entity.js";
import { formatDate } from "../../../core/utils/time-utils.js";

export class CloseableWindowEntity extends BaseTappableGameEntity {
  private readonly TITLE_BAR_HEIGHT: number = 40;
  private readonly TEXT_LINE_HEIGHT: number = 20;
  private readonly PINK_COLOR: string = "#FF69B4";

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
    super(true);
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
      this.fadeIn(0.2);
    }

    this.opened = true;
    this.titleBarText = titleBarText;
    this.title = title;
    this.content = content;
    this.timestamp = timestamp ?? null;
    this.active = true;
  }

  public close(): void {
    if (this.opened === false) {
      console.warn("CloseableWindowEntity is already closed");
      return;
    }

    this.fadeOut(0.2);

    this.opened = false;
    this.active = false;
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.pressed) {
      this.close();
    }

    this.backdropEntity.update(deltaTimeStamp);

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    this.applyOpacity(context);

    this.backdropEntity.render(context);
    this.renderWindow(context);

    context.restore();

    super.render(context);
  }

  private setInitialState(): void {
    this.opacity = 0;
    this.active = false;
    this.setSize();
    this.setCenterPosition();
    this.calculatePositions();
  }

  private setSize(): void {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.width = this.canvas.width * 0.9;
    this.height = 300;
  }

  private setCenterPosition(): void {
    this.x = (this.canvas.width - this.width) / 2;
    this.y = (this.canvas.height - this.height) / 2;
  }

  private calculatePositions(): void {
    this.titleBarTextX = this.x + 15;
    this.titleBarTextY = this.y + 28;

    this.titleTextX = this.x + 14;
    this.titleTextY = this.y + 68; // More top padding from title bar

    this.formattedDateTextX = this.x + 14;
    this.formattedDateTextY = this.y + this.height - 14; // Bottom left of window

    this.contentTextX = this.x + 14;
    this.contentTextY = this.y + this.TITLE_BAR_HEIGHT + 55; // Reduced top margin
    this.contentTextMaxWidth = this.width - 25;
  }

  private wrapText(
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const lines: string[] = [];
    let currentLine = "";
    let currentLineWithoutTags = "";

    // Split by spaces but keep track of <em> tags
    const parts = text.split(" ");

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const testLine =
        currentLineWithoutTags +
        (currentLineWithoutTags ? " " : "") +
        this.stripTags(part);
      const testWidth = context.measureText(testLine).width;

      if (testWidth <= maxWidth) {
        currentLine += (currentLine ? " " : "") + part;
        currentLineWithoutTags = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = part;
        currentLineWithoutTags = this.stripTags(part);
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private stripTags(text: string): string {
    return text.replace(/<em>|<\/em>/g, "");
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
    context.fillRect(this.x, this.y, this.width, this.height);
  }

  private renderTitleBar(context: CanvasRenderingContext2D): void {
    context.fillStyle = LIGHT_GREEN_COLOR;
    context.fillRect(this.x, this.y, this.width, this.TITLE_BAR_HEIGHT);
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
    context.fillStyle = "#000000";
    context.font = "16px system-ui";
    context.textAlign = "left";
    context.fillText(
      formattedDate,
      this.formattedDateTextX,
      this.formattedDateTextY
    );
  }

  private renderTitle(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#000000";
    context.font = "20px system-ui";
    context.textAlign = "left";
    context.fillText(this.title, this.titleTextX, this.titleTextY);
  }

  private renderContent(context: CanvasRenderingContext2D): void {
    context.font = "16px system-ui";
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
    const regex = /<em>(.*?)<\/em>/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Render text before <em> tag
      if (match.index > lastIndex) {
        const normalText = line.substring(lastIndex, match.index);
        context.fillStyle = "#000000";
        context.font = "16px system-ui";
        context.fillText(normalText, currentX, y);
        currentX += context.measureText(normalText).width;
      }

      // Render emphasized text in pink and bold
      context.fillStyle = this.PINK_COLOR;
      context.font = "bold 16px system-ui";
      context.fillText(match[1], currentX, y);
      currentX += context.measureText(match[1]).width;
      lastIndex = regex.lastIndex;
    }

    // Render remaining text after last <em> tag
    if (lastIndex < line.length) {
      const remainingText = line.substring(lastIndex);
      context.fillStyle = "#000000";
      context.font = "16px system-ui";
      context.fillText(remainingText, currentX, y);
    }
  }
}
