import type { OverlayElement } from "../types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";
import { renderOverlay } from "./renderEngine";

/**
 * Renderiza canvas limpo (sem seleção/hover) e retorna um Blob.
 * Usa um canvas offscreen para não afetar o canvas de edição.
 */
export async function exportOverlayAsBlob(
  image: HTMLImageElement,
  elements: OverlayElement[],
  colors: { headlineColor: string; accentColor: string },
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context for export");

  renderOverlay(ctx, image, elements, CANVAS_WIDTH, CANVAS_HEIGHT, colors, {
    selectedId: null,
    hoveredId: null,
    guides: { x: [], y: [] },
    showSelectionHandles: false,
    previewMode: true,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create image blob"))),
      "image/png",
      1.0,
    );
  });
}
