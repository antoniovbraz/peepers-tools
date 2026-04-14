import type { ElementType, OverlayElement } from "./types";

/** Threshold de snap em unidades percentuais */
export const SNAP_THRESHOLD = 2;

/** Linhas de snap (porcentagem) */
export const SNAP_LINES = [5, 50, 95] as const;

/** Dimensões de renderização do canvas */
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1080;

/** Família de fontes utilizada no canvas */
export const CANVAS_FONT_FAMILY = "Inter, sans-serif";

/** Presets de cor fixos */
export const FIXED_COLOR_PRESETS = ["#000000", "#FFFFFF", "#6B7280"] as const;

/** Máximo de entries no undo/redo history */
export const MAX_UNDO_HISTORY = 20;

/** Debounce de text snapshot em ms */
export const TEXT_SNAPSHOT_DEBOUNCE_MS = 500;

/** Threshold de hit test em px (padding ao redor do elemento) */
export const HIT_TEST_THRESHOLD_DESKTOP = 50;
export const HIT_TEST_THRESHOLD_MOBILE = 120;

/** Resize handle size in canvas pixels */
export const RESIZE_HANDLE_SIZE = 16;
export const RESIZE_HANDLE_HIT_AREA = 24;

/** Padding do badge em px */
export const BADGE_PADDING_X = 12;
export const BADGE_PADDING_Y = 8;

/** Defaults por tipo de elemento */
export const ELEMENT_DEFAULTS: Record<ElementType, Partial<OverlayElement>> = {
  headline: {
    text: "Título",
    fontSize: 28,
    bold: true,
    width: 40,
    textAlign: "left",
    textStyle: "none",
    opacity: 100,
    x: 10,
    y: 10,
  },
  subheadline: {
    text: "Subtítulo",
    fontSize: 18,
    bold: false,
    width: 40,
    textAlign: "left",
    textStyle: "none",
    opacity: 100,
    x: 10,
    y: 25,
  },
  bullet: {
    text: "✓ Item",
    fontSize: 16,
    bold: false,
    width: 40,
    textAlign: "left",
    textStyle: "none",
    opacity: 100,
    x: 10,
    y: 40,
  },
  badge: {
    text: "Badge",
    fontSize: 14,
    opacity: 100,
    x: 10,
    y: 80,
  },
  arrow: {
    text: "Detalhe",
    fontSize: 14,
    length: 10,
    rotation: -30,
    opacity: 100,
    x: 50,
    y: 50,
  },
  circle: {
    radius: 10,
    strokeWidth: 3,
    opacity: 100,
    x: 50,
    y: 50,
  },
};
