import type { OverlayElement, HitTestResult } from "../types";

import { CANVAS_FONT_FAMILY, BADGE_PADDING_X, BADGE_PADDING_Y } from "../constants";
import { measureTextBlock } from "./textMeasure";

/**
 * Calcula bounding box de um elemento em pixels canvas.
 * Usa measureTextBlock() para tipos de texto.
 */
export function getElementBounds(
  el: OverlayElement,
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const px = (el.x / 100) * W;
  const py = (el.y / 100) * H;

  switch (el.type) {
    case "headline":
    case "subheadline":
    case "bullet": {
      const maxWidth = (el.width / 100) * W;
      const measurement = measureTextBlock(ctx, el.text, el.fontSize, el.bold, maxWidth);
      return {
        x1: px - 4,
        y1: py - 2,
        x2: px + measurement.totalWidth + 8,
        y2: py + measurement.totalHeight + 2,
      };
    }
    case "badge": {
      ctx.font = `bold ${el.fontSize}px ${CANVAS_FONT_FAMILY}`;
      const metrics = ctx.measureText(el.text);
      return {
        x1: px,
        y1: py,
        x2: px + metrics.width + BADGE_PADDING_X * 2,
        y2: py + el.fontSize + BADGE_PADDING_Y * 2,
      };
    }
    case "circle": {
      const r = (el.radius / 100) * W / 2;
      return { x1: px - r, y1: py - r, x2: px + r, y2: py + r };
    }
    case "arrow": {
      const rotRad = (el.rotation * Math.PI) / 180;
      const lengthPx = (el.length / 100) * W;
      const endX = px + lengthPx * Math.cos(rotRad);
      const endY = py + lengthPx * Math.sin(rotRad);
      const minX = Math.min(px, endX);
      const maxX = Math.max(px, endX);
      const minY = Math.min(py, endY);
      const maxY = Math.max(py, endY);
      // Add padding for text above origin + arrowhead
      return {
        x1: minX - 10,
        y1: minY - 20,
        x2: maxX + 10,
        y2: maxY + 10,
      };
    }
    default:
      return { x1: px - 20, y1: py - 20, x2: px + 20, y2: py + 20 };
  }
}

/**
 * Retorna tamanho do elemento em porcentagem canvas.
 */
export function getElementSizePercent(
  el: OverlayElement,
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
): { w: number; h: number } {
  const bounds = getElementBounds(el, ctx, W, H);
  return {
    w: ((bounds.x2 - bounds.x1) / W) * 100,
    h: ((bounds.y2 - bounds.y1) / H) * 100,
  };
}

/**
 * Testa se coordenadas (px canvas) atingem algum elemento.
 * Itera de trás para frente (z-order).
 */
export function hitTest(
  mx: number,
  my: number,
  elements: OverlayElement[],
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  threshold: number,
): HitTestResult | null {
  const pad = threshold / 2;
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const bounds = getElementBounds(el, ctx, W, H);
    if (
      mx >= bounds.x1 - pad && mx <= bounds.x2 + pad &&
      my >= bounds.y1 - pad && my <= bounds.y2 + pad
    ) {
      return { element: el, bounds };
    }
  }
  return null;
}
