import type { TextMeasurement } from "../types";
import { CANVAS_FONT_FAMILY } from "../constants";

/**
 * Cache for text measurements keyed by "text|fontSize|bold|maxWidth".
 * Avoids re-measuring the same text block on every render + hit test cycle.
 * Call `clearTextCache()` to evict all entries (e.g. on element text change).
 */
const measureCache = new Map<string, TextMeasurement>();
const MAX_CACHE_SIZE = 256;

function cacheKey(text: string, fontSize: number, bold: boolean, maxWidth: number): string {
  return `${text}|${fontSize}|${bold ? 1 : 0}|${Math.round(maxWidth)}`;
}

/** Clear the text measurement cache. Call when fonts change or on editor close. */
export function clearTextCache(): void {
  measureCache.clear();
}

/**
 * Mede um bloco de texto com word wrapping, retornando linhas separadas e dimensões.
 * Utilizada TANTO pelo renderEngine (para desenhar) QUANTO pelo hitTesting (para bounds).
 * Results are cached — identical inputs return the same object without re-measuring.
 */
export function measureTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  bold: boolean,
  maxWidth: number,
): TextMeasurement {
  const key = cacheKey(text, fontSize, bold, maxWidth);
  const cached = measureCache.get(key);
  if (cached) return cached;

  ctx.font = `${bold ? "bold " : ""}${fontSize}px ${CANVAS_FONT_FAMILY}`;
  const lineHeight = fontSize * 1.3;
  const words = (text || "").split(" ");

  if (words.length === 0 || (words.length === 1 && words[0] === "")) {
    const result: TextMeasurement = { lines: [], totalWidth: 0, totalHeight: 0, lineHeight };
    measureCache.set(key, result);
    return result;
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

  const result: TextMeasurement = {
    lines,
    totalWidth: maxLineWidth,
    totalHeight: lines.length * lineHeight,
    lineHeight,
  };

  // Evict oldest entries if cache is too large
  if (measureCache.size >= MAX_CACHE_SIZE) {
    const first = measureCache.keys().next().value;
    if (first !== undefined) measureCache.delete(first);
  }
  measureCache.set(key, result);

  return result;
}
