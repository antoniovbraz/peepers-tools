import type { OverlayElement, RenderOptions } from "../types";

import { CANVAS_FONT_FAMILY, BADGE_PADDING_X, BADGE_PADDING_Y } from "../constants";
import { measureTextBlock } from "./textMeasure";
import { getElementBounds } from "./hitTesting";

/**
 * Renderiza a imagem base + todos overlay elements no contexto canvas.
 * Função PURA — sem estado React, sem side effects.
 */
export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  elements: OverlayElement[],
  W: number,
  H: number,
  colors: { headlineColor: string; accentColor: string },
  options: RenderOptions,
): void {
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(image, 0, 0, W, H);

  // Draw snap guides
  if (!options.previewMode && (options.guides.x.length > 0 || options.guides.y.length > 0)) {
    ctx.save();
    ctx.strokeStyle = "hsl(0 84% 60%)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    for (const gx of options.guides.x) {
      const px = (gx / 100) * W;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    for (const gy of options.guides.y) {
      const py = (gy / 100) * H;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  for (const el of elements) {
    const px = (el.x / 100) * W;
    const py = (el.y / 100) * H;
    const opacity = el.opacity / 100;
    ctx.save();
    ctx.globalAlpha = opacity;

    // Rotation for arrow type
    if (el.type === "arrow" || el.type === "circle") {
      // Arrow uses rotation for the line direction, handled in its own drawing.
      // Circle doesn't rotate visually. No transform needed here.
    }

    switch (el.type) {
      case "headline":
      case "subheadline":
      case "bullet": {
        const fontSize = el.fontSize;
        ctx.font = `${el.bold ? "bold " : ""}${fontSize}px ${CANVAS_FONT_FAMILY}`;
        ctx.fillStyle = el.color;
        ctx.textBaseline = "top";
        const maxWidth = (el.width / 100) * W;
        const measurement = measureTextBlock(ctx, el.text, fontSize, el.bold, maxWidth);
        const lineHeight = measurement.lineHeight;
        const textAlignVal = el.textAlign;

        const hasTextShadow = el.textStyle === "shadow";
        const hasTextStroke = el.textStyle === "stroke";

        let currentY = py;
        for (const lineText of measurement.lines) {
          const lineW = ctx.measureText(lineText).width;
          let drawX = px;
          if (textAlignVal === "center") drawX = px + (maxWidth - lineW) / 2;
          else if (textAlignVal === "right") drawX = px + maxWidth - lineW;

          // Background
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillRect(drawX - 4, currentY - 2, lineW + 8, lineHeight);

          // Text effects
          if (hasTextShadow) {
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
          }
          if (hasTextStroke) {
            ctx.strokeStyle = "rgba(0,0,0,0.8)";
            ctx.lineWidth = fontSize / 8;
            ctx.strokeText(lineText, drawX, currentY);
          }

          ctx.fillStyle = el.color;
          ctx.fillText(lineText, drawX, currentY);

          if (hasTextShadow) {
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }

          currentY += lineHeight;
        }
        break;
      }
      case "badge": {
        const fontSize = el.fontSize;
        ctx.font = `bold ${fontSize}px ${CANVAS_FONT_FAMILY}`;
        const text = el.text;
        const metrics = ctx.measureText(text);
        const bw = metrics.width + BADGE_PADDING_X * 2;
        const bh = fontSize + BADGE_PADDING_Y * 2;
        ctx.fillStyle = el.bgColor;
        ctx.beginPath();
        ctx.roundRect(px, py, bw, bh, bh / 2);
        ctx.fill();
        ctx.fillStyle = el.color;
        ctx.textBaseline = "middle";
        ctx.fillText(text, px + BADGE_PADDING_X, py + bh / 2);
        break;
      }
      case "circle": {
        const r = (el.radius / 100) * W / 2;
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.strokeWidth;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
      case "arrow": {
        const rotRad = (el.rotation * Math.PI) / 180;
        const lengthPx = (el.length / 100) * W;
        const endX = px + lengthPx * Math.cos(rotRad);
        const endY = py + lengthPx * Math.sin(rotRad);

        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrowhead triangle
        const headLen = 12;
        const angle = Math.atan2(endY - py, endX - px);
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle - Math.PI / 6),
          endY - headLen * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          endX - headLen * Math.cos(angle + Math.PI / 6),
          endY - headLen * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();

        // Text above arrow origin
        if (el.text) {
          const fontSize = el.fontSize;
          ctx.font = `${fontSize}px ${CANVAS_FONT_FAMILY}`;
          ctx.fillStyle = el.color;
          ctx.textBaseline = "bottom";
          ctx.fillText(el.text, px, py - 4);
        }
        break;
      }
    }

    ctx.globalAlpha = 1;

    // Hover/selection overlays
    if (!options.previewMode) {
      if (el.id === options.hoveredId && el.id !== options.selectedId) {
        const bounds = getElementBounds(el, ctx, W, H);
        ctx.strokeStyle = "hsl(215 20% 65%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          bounds.x1 - 2, bounds.y1 - 2,
          bounds.x2 - bounds.x1 + 4, bounds.y2 - bounds.y1 + 4,
        );
        ctx.setLineDash([]);
      }

      if (el.id === options.selectedId) {
        const bounds = getElementBounds(el, ctx, W, H);
        ctx.strokeStyle = "hsl(217.2 91.2% 59.8%)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          bounds.x1 - 4, bounds.y1 - 4,
          bounds.x2 - bounds.x1 + 8, bounds.y2 - bounds.y1 + 8,
        );
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }
}
