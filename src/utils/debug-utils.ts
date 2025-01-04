export class DebugUtils {
  public static renderDebugText(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    subtractWidth = false,
    subtractHeight = false
  ): void {
    context.font = "14px system-ui";

    const textWidth = context.measureText(text).width;
    const boxWidth = textWidth + 12; // Add margin to the calculated text width

    // Adjust the x-coordinate if subtractWidthWidth is true
    const adjustedX = subtractWidth ? x - boxWidth : x;
    const adjustedY = subtractHeight ? y - 22 : y;

    // Render background box
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(adjustedX, adjustedY, boxWidth, 22);

    // Render text
    context.fillStyle = "#FFFF00";
    context.textAlign = "left";
    context.fillText(text, adjustedX + 6, adjustedY + 16);
  }
}
