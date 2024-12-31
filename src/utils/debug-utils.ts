export class DebugUtils {
  public static renderDebugText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number
  ): void {
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(x, y, width, 20);
    context.fillStyle = "#FFFF00";
    context.font = "12px system-ui";
    context.textAlign = "left";
    context.fillText(text, x + 6, y + 14);
  }
}
