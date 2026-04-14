import { SNAP_THRESHOLD, SNAP_LINES } from "../constants";

/** Snap lines from other elements (left/center/right edges + top/center/bottom). */
export interface ElementSnapInfo {
  id: string;
  x: number; // left edge %
  y: number; // top edge %
  w: number; // width %
  h: number; // height %
}

/**
 * Calcula posição snapped + clamped para drag.
 * Testa left/center/right edges contra:
 *   1. Snap lines fixas (5/50/95%)
 *   2. Edges/centros de OUTROS elementos (se elementSnaps fornecido)
 */
export function getSnappedPos(
  x: number,
  y: number,
  elW = 0,
  elH = 0,
  elementSnaps?: ElementSnapInfo[],
): { x: number; y: number; guidesX: number[]; guidesY: number[] } {
  let sx = x, sy = y;
  const guidesX: number[] = [];
  const guidesY: number[] = [];

  // Build full snap-to lines: fixed lines + other element edges
  const xLines: number[] = [...SNAP_LINES];
  const yLines: number[] = [...SNAP_LINES];

  if (elementSnaps) {
    for (const snap of elementSnaps) {
      // left, center, right edges of other elements
      xLines.push(snap.x, snap.x + snap.w / 2, snap.x + snap.w);
      // top, center, bottom edges
      yLines.push(snap.y, snap.y + snap.h / 2, snap.y + snap.h);
    }
  }

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
    for (const line of xLines) {
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
    for (const line of yLines) {
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

/**
 * Clampa posição dentro dos limites do canvas (0-100%).
 */
export function clampToCanvas(
  x: number,
  y: number,
  elW: number,
  elH: number,
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(100 - elW, x)),
    y: Math.max(0, Math.min(100 - elH, y)),
  };
}
