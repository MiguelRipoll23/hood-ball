export class DebugUtils {
  public static renderDebugText(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string
  ): void {
    context.font = "12px system-ui";

    const textWidth = context.measureText(text).width;
    const boxWidth = textWidth + 12; // Add margin to the calculated text width

    // Render background box
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(x, y, boxWidth, 20);

    // Render text
    context.fillStyle = "#FFFF00";
    context.textAlign = "left";
    context.fillText(text, x + 6, y + 14);
  }
}
