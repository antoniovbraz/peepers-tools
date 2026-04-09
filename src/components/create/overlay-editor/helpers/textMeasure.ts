import type { TextMeasurement } from "../types";
import { CANVAS_FONT_FAMILY } from "../constants";

/**
 * Mede um bloco de texto com word wrapping, retornando linhas separadas e dimensões.
 * Utilizada TANTO pelo renderEngine (para desenhar) QUANTO pelo hitTesting (para bounds).
 */
export function measureTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  bold: boolean,
  maxWidth: number,
): TextMeasurement {
  ctx.font = `${bold ? "bold " : ""}${fontSize}px ${CANVAS_FONT_FAMILY}`;
  const lineHeight = fontSize * 1.3;
  const words = (text || "").split(" ");

  if (words.length === 0 || (words.length === 1 && words[0] === "")) {
    return { lines: [], totalWidth: 0, totalHeight: 0, lineHeight };
  }

  const lines: string[] = [];
  let currentLine = "";
  let maxLineWidth = 0;

  for (const word of words) {
    const test = currentLine + (currentLine ? " " : "") + word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      const lineWidth = ctx.measureText(currentLine).width;
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }

  if (currentLine) {
    const lineWidth = ctx.measureText(currentLine).width;
    maxLineWidth = Math.max(maxLineWidth, lineWidth);
    lines.push(currentLine);
  }

  return {
    lines,
    totalWidth: maxLineWidth,
    totalHeight: lines.length * lineHeight,
    lineHeight,
  };
}
