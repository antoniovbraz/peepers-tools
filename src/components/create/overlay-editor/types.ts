/** Campos compartilhados por todos os tipos */
export interface BaseElement {
  id: string;
  x: number; // porcentagem 0-100
  y: number; // porcentagem 0-100
  opacity: number; // 0-100, default 100
}

/** Campos compartilhados por elementos de texto */
export interface TextElementBase extends BaseElement {
  text: string;
  fontSize: number; // px
  color: string;
  bold: boolean;
  width: number; // porcentagem 0-100 (maxWidth para text wrapping)
  textAlign: "left" | "center" | "right";
  textStyle: "none" | "shadow" | "stroke";
}

export interface HeadlineElement extends TextElementBase {
  type: "headline";
}

export interface SubheadlineElement extends TextElementBase {
  type: "subheadline";
}

export interface BulletElement extends TextElementBase {
  type: "bullet";
}

export interface BadgeElement extends BaseElement {
  type: "badge";
  text: string;
  fontSize: number;
  color: string;
  bgColor: string;
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  text: string;
  fontSize: number;
  color: string;
  length: number; // porcentagem 0-100
  rotation: number; // graus (-180 a 180)
}

export interface CircleElement extends BaseElement {
  type: "circle";
  radius: number; // porcentagem 0-100
  color: string;
  strokeWidth: number; // px
}

/** Union discriminada — o campo `type` determina quais campos existem */
export type OverlayElement =
  | HeadlineElement
  | SubheadlineElement
  | BulletElement
  | BadgeElement
  | ArrowElement
  | CircleElement;

/** Todos os tipos possíveis de elemento */
export type ElementType = OverlayElement["type"];

/** Extrai o tipo de elemento baseado no discriminator */
export type ElementOfType<T extends ElementType> = Extract<OverlayElement, { type: T }>;

/** Opções passadas ao render engine */
export interface RenderOptions {
  selectedId: string | null;
  hoveredId: string | null;
  guides: { x: number[]; y: number[] };
  showSelectionHandles: boolean;
  previewMode: boolean;
}

/** Resultado de hit test */
export interface HitTestResult {
  element: OverlayElement;
  bounds: { x1: number; y1: number; x2: number; y2: number };
}

/** Resultado de medição de texto */
export interface TextMeasurement {
  lines: string[];
  totalWidth: number; // px
  totalHeight: number; // px
  lineHeight: number; // px
}

/** Props do componente principal */
export interface OverlayEditorProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageIndex: number; // 1-7 (1 = cover, sem overlay)
  headlineColor: string;
  accentColor: string;
  productName: string;
  characteristics: string[];
  onSaveOverlay: (overlayUrl: string) => void;
}

// ── Type guards ──

export function isTextElement(
  el: OverlayElement,
): el is HeadlineElement | SubheadlineElement | BulletElement {
  return el.type === "headline" || el.type === "subheadline" || el.type === "bullet";
}

export function hasText(
  el: OverlayElement,
): el is HeadlineElement | SubheadlineElement | BulletElement | BadgeElement | ArrowElement {
  return "text" in el;
}

export function hasBgColor(el: OverlayElement): el is BadgeElement {
  return el.type === "badge";
}

export function hasRotation(el: OverlayElement): el is ArrowElement | CircleElement {
  return el.type === "arrow" || el.type === "circle";
}

// ── Migration ──

/**
 * Converte um elemento no formato antigo (campos opcionais flat)
 * para o novo formato discriminated union com todos os campos preenchidos.
 */
export function migrateElement(raw: Record<string, unknown>): OverlayElement {
  const type = raw.type as string;
  const base = {
    id: (raw.id as string) || `migrated-${Date.now()}`,
    x: (raw.x as number) ?? 10,
    y: (raw.y as number) ?? 10,
    opacity: (raw.opacity as number) ?? 100,
  };

  switch (type) {
    case "headline":
    case "subheadline":
    case "bullet":
      return {
        ...base,
        type,
        text: (raw.text as string) ?? "",
        fontSize: (raw.fontSize as number) ?? 16,
        color: (raw.color as string) ?? "#000000",
        bold: (raw.bold as boolean) ?? false,
        width: (raw.width as number) ?? 40,
        textAlign: (raw.textAlign as "left" | "center" | "right") ?? "left",
        textStyle: (raw.textStyle as "none" | "shadow" | "stroke") ?? "none",
      };
    case "badge":
      return {
        ...base,
        type: "badge",
        text: (raw.text as string) ?? "Badge",
        fontSize: (raw.fontSize as number) ?? 14,
        color: (raw.color as string) ?? "#FFFFFF",
        bgColor: (raw.bgColor as string) ?? "#000000",
      };
    case "arrow":
      return {
        ...base,
        type: "arrow",
        text: (raw.text as string) ?? "",
        fontSize: (raw.fontSize as number) ?? 14,
        color: (raw.color as string) ?? "#000000",
        length: (raw.length as number) ?? 10,
        rotation: (raw.rotation as number) ?? -30,
      };
    case "circle": {
      // Migration: old format used `width` for diameter, new uses `radius`
      const oldWidth = raw.width as number | undefined;
      const radius = (raw.radius as number) ?? (oldWidth ? oldWidth / 2 : 10);
      return {
        ...base,
        type: "circle",
        radius,
        color: (raw.color as string) ?? "#000000",
        strokeWidth: (raw.strokeWidth as number) ?? 3,
      };
    }
    default:
      // Fallback: treat as headline
      return {
        ...base,
        type: "headline",
        text: (raw.text as string) ?? "",
        fontSize: (raw.fontSize as number) ?? 16,
        color: (raw.color as string) ?? "#000000",
        bold: false,
        width: 40,
        textAlign: "left",
        textStyle: "none",
      };
  }
}
