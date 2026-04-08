import type { OverlayElement } from "@/lib/overlayTemplates";

/** Snap threshold in percentage units. */
export const SNAP_THRESHOLD = 2;
/** Canvas percentage positions that snap guides appear on. */
export const SNAP_LINES = [5, 50, 95];

/**
 * Returns the bounding box (in canvas pixels) for a given overlay element.
 * Used for selection highlight, hit-testing, and snap sizing.
 */
export function getElementBounds(
  el: OverlayElement,
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  _headlineColor: string,
): { x1: number; y1: number; x2: number; y2: number } {
  const px = (el.x / 100) * W;
  const py = (el.y / 100) * H;
  const fontSize = el.fontSize || 16;

  switch (el.type) {
    case "headline":
    case "subheadline":
    case "bullet": {
      ctx.font = `${el.bold ? "bold " : ""}${fontSize}px Inter, sans-serif`;
      const maxWidth = el.width ? (el.width / 100) * W : W - px - 20;
      const words = (el.text || "").split(" ");
      let line = "";
      let lineY = py;
      const lineHeight = fontSize * 1.3;
      let maxLineW = 0;
      for (const word of words) {
        const test = line + (line ? " " : "") + word;
        if (ctx.measureText(test).width > maxWidth && line) {
          maxLineW = Math.max(maxLineW, ctx.measureText(line).width);
          line = word;
          lineY += lineHeight;
        } else {
          line = test;
        }
      }
      if (line) maxLineW = Math.max(maxLineW, ctx.measureText(line).width);
      return { x1: px - 4, y1: py - 2, x2: px + maxLineW + 8, y2: lineY + lineHeight + 2 };
    }
    case "badge": {
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const text = el.text || "";
      const metrics = ctx.measureText(text);
      const padX = 12, padY = 8;
      return { x1: px, y1: py, x2: px + metrics.width + padX * 2, y2: py + fontSize + padY * 2 };
    }
    case "circle": {
      const r = el.width ? ((el.width / 100) * W) / 2 : 60;
      return { x1: px - r, y1: py - r, x2: px + r, y2: py + r };
    }
    case "arrow": {
      return { x1: px - 10, y1: py - 20, x2: px + 70, y2: py + 50 };
    }
    default:
      return { x1: px - 20, y1: py - 20, x2: px + 20, y2: py + 20 };
  }
}

/**
 * Returns the element bounding box size as canvas percentages (0–100).
 * Used for snap clamping and alignment calculations.
 */
export function getElementSizePercent(
  el: OverlayElement,
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  headlineColor: string,
): { w: number; h: number } {
  const bounds = getElementBounds(el, ctx, W, H, headlineColor);
  return {
    w: ((bounds.x2 - bounds.x1) / W) * 100,
    h: ((bounds.y2 - bounds.y1) / H) * 100,
  };
}

/**
 * Snaps a drag position to the nearest guide line, testing left/center/right edges.
 * Returns the adjusted position and which guide lines are active.
 */
export function getSnappedPos(
  x: number,
  y: number,
  elW = 0,
  elH = 0,
): { x: number; y: number; guidesX: number[]; guidesY: number[] } {
  let sx = x, sy = y;
  const guidesX: number[] = [];
  const guidesY: number[] = [];

  const xAnchors = [
    { edge: x, adjust: 0 },
    { edge: x + elW / 2, adjust: -elW / 2 },
    { edge: x + elW, adjust: -elW },
  ];
  const yAnchors = [
    { edge: y, adjust: 0 },
    { edge: y + elH / 2, adjust: -elH / 2 },
    { edge: y + elH, adjust: -elH },
  ];

  let bestXDist = SNAP_THRESHOLD;
  for (const a of xAnchors) {
    for (const line of SNAP_LINES) {
      const dist = Math.abs(a.edge - line);
      if (dist < bestXDist) {
        bestXDist = dist;
        sx = line + a.adjust;
        guidesX.length = 0;
        guidesX.push(line);
      }
    }
  }

  let bestYDist = SNAP_THRESHOLD;
  for (const a of yAnchors) {
    for (const line of SNAP_LINES) {
      const dist = Math.abs(a.edge - line);
      if (dist < bestYDist) {
        bestYDist = dist;
        sy = line + a.adjust;
        guidesY.length = 0;
        guidesY.push(line);
      }
    }
  }

  return { x: sx, y: sy, guidesX, guidesY };
}
