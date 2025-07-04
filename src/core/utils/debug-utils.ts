export class DebugUtils {
  public static renderText(
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

  public static getHexDump(
    uint8: Uint8Array,
    bytesPerLine: number = 24
  ): string {
    const lines: string[] = [];
    for (let i = 0; i < uint8.length; i += bytesPerLine) {
      const chunk = Array.from(uint8.slice(i, i + bytesPerLine));
      const hex = chunk
        .map(
          (b, j) =>
            b.toString(16).padStart(2, "0") + ((j + 1) % 8 === 0 ? "  " : " ")
        )
        .join("")
        .padEnd(bytesPerLine * 3 + Math.floor(bytesPerLine / 8), " ");
      const ascii = chunk
        .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : "."))
        .join("");
      lines.push(`${i.toString(16).padStart(4, "0")}: ${hex} ${ascii}`);
    }
    return lines.join("\n");
  }
}
