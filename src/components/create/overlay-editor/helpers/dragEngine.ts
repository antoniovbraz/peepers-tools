import { SNAP_THRESHOLD, SNAP_LINES } from "../constants";

/**
 * Calcula posição snapped + clamped para drag.
 * Testa left/center/right edges contra cada snap line.
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
