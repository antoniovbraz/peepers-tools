import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Type, Plus, Trash2, Download, Loader2, Sparkles, Move,
  ArrowRight, Circle, RotateCw, X, Minus, Tag, ListChecks,
  Bold, ChevronUp, ChevronDown, Undo2, Redo2, Copy,
  AlignLeft, AlignCenter, AlignRight, ChevronsDown,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween,
} from "lucide-react";
import { OverlayElement, getDefaultTemplate, IMAGE_ROLES } from "@/lib/overlayTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreateListing } from "@/context/CreateListingContext";

/* ── NumberStepper ── */
function NumberStepper({
  value, onChange, min = 0, max = 999, step = 1, label,
}: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; label?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0"
          onClick={() => onChange(clamp(value - step))}>
          <Minus className="w-4 h-4" />
        </Button>
        <span className="min-w-[3ch] text-center font-mono text-sm tabular-nums">{value}</span>
        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0"
          onClick={() => onChange(clamp(value + step))}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Layer icon helper ── */
function LayerIcon({ type }: { type: OverlayElement["type"] }) {
  switch (type) {
    case "headline": return <Type className="w-3.5 h-3.5 text-primary" />;
    case "subheadline": return <Type className="w-3 h-3 text-muted-foreground" />;
    case "bullet": return <ListChecks className="w-3.5 h-3.5 text-primary" />;
    case "badge": return <Tag className="w-3.5 h-3.5 text-primary" />;
    case "arrow": return <ArrowRight className="w-3.5 h-3.5 text-primary" />;
    case "circle": return <Circle className="w-3.5 h-3.5 text-primary" />;
    default: return null;
  }
}

/* ── Color Swatch ── */
function ColorSwatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`w-8 h-8 rounded-full border-2 transition-all active:scale-95 ${
        active ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border hover:scale-105"
      }`}
      style={{ backgroundColor: color }}
      onClick={onClick}
    />
  );
}

/* ── Props ── */
interface ImageOverlayEditorProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageIndex: number;
  headlineColor: string;
  accentColor: string;
  productName: string;
  characteristics: string[];
  onSaveOverlay: (overlayUrl: string) => void;
}

/* ── Undo/Redo hook with debounced text snapshots ── */
const MAX_HISTORY = 20;

function useUndoRedo(elements: OverlayElement[], setElements: React.Dispatch<React.SetStateAction<OverlayElement[]>>) {
  const historyRef = useRef<OverlayElement[][]>([]);
  const futureRef = useRef<OverlayElement[][]>([]);
  const skipRef = useRef(false);

  const pushSnapshot = useCallback((snapshot: OverlayElement[]) => {
    if (skipRef.current) { skipRef.current = false; return; }
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), snapshot];
    futureRef.current = [];
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, elements];
    skipRef.current = true;
    setElements(prev);
  }, [elements, setElements]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, elements];
    skipRef.current = true;
    setElements(next);
  }, [elements, setElements]);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}

/* ── Bounding box helpers ── */
function getElementBounds(
  el: OverlayElement,
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
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

/* ── Element size in percent ── */
function getElementSizePercent(
  el: OverlayElement,
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  headlineColor: string,
): { w: number; h: number } {
  const bounds = getElementBounds(el, ctx, W, H, headlineColor);
  return {
    w: ((bounds.x2 - bounds.x1) / W) * 100,
    h: ((bounds.y2 - bounds.y1) / H) * 100,
  };
}

/* ── Snap guide helpers (Fix 4: smart snap with element bounds) ── */
const SNAP_THRESHOLD = 2;
const SNAP_LINES = [5, 50, 95];

function getSnappedPos(
  x: number, y: number,
  elW: number = 0, elH: number = 0,
): { x: number; y: number; guidesX: number[]; guidesY: number[] } {
  let sx = x, sy = y;
  const guidesX: number[] = [];
  const guidesY: number[] = [];

  // Test 3 anchor points per axis: left/center/right
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

export default function ImageOverlayEditor({
  open, onClose, imageUrl, imageIndex,
  headlineColor, accentColor, productName, characteristics, onSaveOverlay,
}: ImageOverlayEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<OverlayElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatingElementId, setGeneratingElementId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [fontsReady, setFontsReady] = useState(false);
  const [canvasSize, setCanvasSize] = useState(400);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeGuides, setActiveGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [showDragBadge, setShowDragBadge] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const { updateOverlayElements, getOverlayElements, getAllOverlayCopies } = useCreateListing();
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(elements, setElements);

  // rAF drag refs
  const draggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevElementsRef = useRef<OverlayElement[]>([]);
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preTextSnapshotRef = useRef<OverlayElement[] | null>(null);
  const lastTapRef = useRef<{ time: number; id: string | null }>({ time: 0, id: null });
  const textInputRef = useRef<HTMLInputElement>(null);
  // Fix 1: track whether drag moved
  const dragMovedRef = useRef(false);
  // Fix 4: store dragged element for size calc during rAF
  const dragElementRef = useRef<OverlayElement | null>(null);

  const role = IMAGE_ROLES[imageIndex - 1];

  // Font loading
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // Dynamic canvas sizing
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (isMobile) {
        const vw = window.innerWidth - 24;
        const vh = window.innerHeight * 0.35;
        setCanvasSize(Math.floor(Math.min(vw, vh)));
      } else {
        setCanvasSize(0);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, isMobile]);

  // Badge fade-out after 3s
  useEffect(() => {
    if (!open) return;
    setShowDragBadge(true);
    const t = setTimeout(() => setShowDragBadge(false), 3000);
    return () => clearTimeout(t);
  }, [open]);

  // Load template or persisted elements on open
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      loadedForRef.current = null;
      return;
    }
    const key = `${imageIndex}`;
    if (loadedForRef.current === key) return;
    loadedForRef.current = key;

    const saved = getOverlayElements(imageIndex);
    if (saved && saved.length > 0) {
      setElements(saved as OverlayElement[]);
    } else {
      setElements(getDefaultTemplate(imageIndex, headlineColor, accentColor));
    }
    setSelectedId(null);
    setCheckedIds(new Set());
    setSheetOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageIndex]);

  // Persist elements to context on change
  useEffect(() => {
    if (open && elements.length > 0) {
      updateOverlayElements(imageIndex, elements);
    }
  }, [elements, open, imageIndex, updateOverlayElements]);

  // Smart undo
  const pushStructuralSnapshot = useCallback(() => {
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
      textDebounceRef.current = null;
    }
    if (preTextSnapshotRef.current) {
      pushSnapshot(preTextSnapshotRef.current);
      preTextSnapshotRef.current = null;
    } else {
      pushSnapshot([...elements]);
    }
  }, [elements, pushSnapshot]);

  const pushTextSnapshot = useCallback(() => {
    if (!preTextSnapshotRef.current) {
      preTextSnapshotRef.current = [...elements];
    }
    if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
    textDebounceRef.current = setTimeout(() => {
      if (preTextSnapshotRef.current) {
        pushSnapshot(preTextSnapshotRef.current);
        preTextSnapshotRef.current = null;
      }
      textDebounceRef.current = null;
    }, 500);
  }, [elements, pushSnapshot]);

  // Load base image
  useEffect(() => {
    if (!imageUrl || !open) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedImage(img);
    img.onerror = () => console.error("Failed to load image for overlay");
    img.src = imageUrl;
  }, [imageUrl, open]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault(); undo(); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault(); redo(); return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        pushStructuralSnapshot();
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null); setSheetOpen(false); return;
      }
      if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowLeft" ? -delta : e.key === "ArrowRight" ? delta : 0;
        const dy = e.key === "ArrowUp" ? -delta : e.key === "ArrowDown" ? delta : 0;
        setElements(prev => prev.map(el =>
          el.id === selectedId
            ? { ...el, x: Math.max(0, Math.min(100, el.x + dx)), y: Math.max(0, Math.min(100, el.y + dy)) }
            : el
        ));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selectedId, undo, redo, pushStructuralSnapshot]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage || !fontsReady) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;
    ctx.drawImage(loadedImage, 0, 0, W, H);

    // Draw snap guides
    if (activeGuides.x.length > 0 || activeGuides.y.length > 0) {
      ctx.save();
      ctx.strokeStyle = "hsl(0 84% 60%)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      for (const gx of activeGuides.x) {
        const px = (gx / 100) * W;
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
      }
      for (const gy of activeGuides.y) {
        const py = (gy / 100) * H;
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    for (const el of elements) {
      const px = (el.x / 100) * W;
      const py = (el.y / 100) * H;
      const fontSize = el.fontSize || 16;
      const opacity = (el.opacity ?? 100) / 100;
      ctx.save();
      ctx.globalAlpha = opacity;

      if (el.rotation) {
        ctx.translate(px, py);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-px, -py);
      }

      const textAlignVal = el.textAlign || "left";

      switch (el.type) {
        case "headline":
        case "subheadline":
        case "bullet": {
          ctx.font = `${el.bold ? "bold " : ""}${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = el.color || headlineColor;
          ctx.textBaseline = "top";
          const maxWidth = el.width ? (el.width / 100) * W : W - px - 20;

          const hasTextShadow = el.textStyle === "shadow";
          const hasTextStroke = el.textStyle === "stroke";

          const words = (el.text || "").split(" ");
          let line = "";
          let lineY = py;
          const lineHeight = fontSize * 1.3;

          const drawTextLine = (text: string, x: number, y: number) => {
            const lineW = ctx.measureText(text).width;
            let drawX = x;
            if (textAlignVal === "center") drawX = x + (maxWidth - lineW) / 2;
            else if (textAlignVal === "right") drawX = x + maxWidth - lineW;

            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(drawX - 4, y - 2, lineW + 8, lineHeight);

            if (hasTextShadow) {
              ctx.shadowColor = "rgba(0,0,0,0.5)";
              ctx.shadowBlur = 6;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;
            }
            if (hasTextStroke) {
              ctx.strokeStyle = "rgba(0,0,0,0.8)";
              ctx.lineWidth = fontSize / 8;
              ctx.strokeText(text, drawX, y);
            }

            ctx.fillStyle = el.color || headlineColor;
            ctx.fillText(text, drawX, y);

            if (hasTextShadow) {
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
            }
          };

          for (const word of words) {
            const test = line + (line ? " " : "") + word;
            if (ctx.measureText(test).width > maxWidth && line) {
              drawTextLine(line, px, lineY);
              line = word;
              lineY += lineHeight;
            } else {
              line = test;
            }
          }
          if (line) drawTextLine(line, px, lineY);
          break;
        }
        case "badge": {
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          const text = el.text || "";
          const metrics = ctx.measureText(text);
          const padX = 12, padY = 8;
          const bw = metrics.width + padX * 2;
          const bh = fontSize + padY * 2;
          ctx.fillStyle = el.bgColor || accentColor;
          ctx.beginPath();
          ctx.roundRect(px, py, bw, bh, bh / 2);
          ctx.fill();
          ctx.fillStyle = el.color || "#FFFFFF";
          ctx.textBaseline = "middle";
          ctx.fillText(text, px + padX, py + bh / 2);
          break;
        }
        case "circle": {
          const r = el.width ? ((el.width / 100) * W) / 2 : 60;
          ctx.strokeStyle = el.color || accentColor;
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case "arrow": {
          ctx.strokeStyle = el.color || headlineColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + 60, py + 40);
          ctx.stroke();
          ctx.fillStyle = el.color || headlineColor;
          ctx.beginPath();
          ctx.moveTo(px + 60, py + 40);
          ctx.lineTo(px + 50, py + 32);
          ctx.lineTo(px + 52, py + 42);
          ctx.closePath();
          ctx.fill();
          if (el.text) {
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = el.color || headlineColor;
            ctx.textBaseline = "bottom";
            ctx.fillText(el.text, px, py - 4);
          }
          break;
        }
      }

      ctx.globalAlpha = 1;

      if (el.id === hoveredId && el.id !== selectedId) {
        const bounds = getElementBounds(el, ctx, W, H, headlineColor);
        ctx.strokeStyle = "hsl(215 20% 65%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bounds.x1 - 2, bounds.y1 - 2, bounds.x2 - bounds.x1 + 4, bounds.y2 - bounds.y1 + 4);
        ctx.setLineDash([]);
      }

      if (el.id === selectedId) {
        const bounds = getElementBounds(el, ctx, W, H, headlineColor);
        ctx.strokeStyle = "hsl(217.2 91.2% 59.8%)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(bounds.x1 - 4, bounds.y1 - 4, bounds.x2 - bounds.x1 + 8, bounds.y2 - bounds.y1 + 8);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }, [elements, loadedImage, selectedId, hoveredId, headlineColor, accentColor, fontsReady, activeGuides]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  // ── Helper: get element size in % using canvas ctx ──
  const getElSize = useCallback((el: OverlayElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return { w: 0, h: 0 };
    const ctx = canvas.getContext("2d");
    if (!ctx) return { w: 0, h: 0 };
    return getElementSizePercent(el, ctx, canvas.width, canvas.height, headlineColor);
  }, [headlineColor]);

  // ── rAF drag loop with smart snap (Fix 4) ──
  const dragLoop = useCallback(() => {
    const pos = dragPosRef.current;
    const id = draggingRef.current;
    if (!pos || !id) return;

    const el = dragElementRef.current;
    let elW = 0, elH = 0;
    if (el) {
      const size = getElSize(el);
      elW = size.w;
      elH = size.h;
    }

    // Fix 6: clamp to canvas bounds
    const clampedX = Math.max(0, Math.min(100 - elW, pos.x));
    const clampedY = Math.max(0, Math.min(100 - elH, pos.y));

    const snapped = getSnappedPos(clampedX, clampedY, elW, elH);
    setActiveGuides({ x: snapped.guidesX, y: snapped.guidesY });
    setElements(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, x: snapped.x, y: snapped.y } : e);
      // Keep dragElementRef in sync
      const updatedEl = updated.find(e => e.id === id);
      if (updatedEl) dragElementRef.current = updatedEl;
      return updated;
    });
    dragPosRef.current = null;
    rafRef.current = null;
  }, [getElSize]);

  const scheduleRaf = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(dragLoop);
  }, [dragLoop]);

  // ── Pointer helpers ──
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { mx: (clientX - rect.left) * scaleX, my: (clientY - rect.top) * scaleY, canvas };
  };

  const hitTest = (mx: number, my: number, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const W = canvas.width, H = canvas.height;
    const threshold = isMobile ? 120 : 50;

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const bounds = getElementBounds(el, ctx, W, H, headlineColor);
      const pad = threshold / 2;
      if (
        mx >= bounds.x1 - pad && mx <= bounds.x2 + pad &&
        my >= bounds.y1 - pad && my <= bounds.y2 + pad
      ) {
        return el;
      }
    }
    return null;
  };

  // Fix 1: Don't open sheet on startDrag, only select
  const startDrag = (clientX: number, clientY: number) => {
    const c = getCanvasCoords(clientX, clientY);
    if (!c) return false;
    const el = hitTest(c.mx, c.my, c.canvas);
    if (el) {
      setSelectedId(el.id);
      dragMovedRef.current = false; // Fix 1: reset
      draggingRef.current = el.id;
      dragElementRef.current = el; // Fix 4: store for size calc
      dragOffsetRef.current = { x: c.mx - (el.x / 100) * c.canvas.width, y: c.my - (el.y / 100) * c.canvas.height };
      pushStructuralSnapshot();
      return true;
    } else {
      setSelectedId(null);
      if (isMobile) setSheetOpen(false);
      return false;
    }
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    dragMovedRef.current = true; // Fix 1: mark as drag
    const c = getCanvasCoords(clientX, clientY);
    if (!c) return;
    dragPosRef.current = {
      x: ((c.mx - dragOffsetRef.current.x) / c.canvas.width) * 100,
      y: ((c.my - dragOffsetRef.current.y) / c.canvas.height) * 100,
    };
    scheduleRaf();
  };

  // Fix 1: Open sheet only if tap (no movement)
  const endDrag = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const pos = dragPosRef.current;
    const id = draggingRef.current;

    if (pos && id) {
      const el = dragElementRef.current;
      let elW = 0, elH = 0;
      if (el) {
        const size = getElSize(el);
        elW = size.w;
        elH = size.h;
      }
      // Fix 6: clamp
      const clampedX = Math.max(0, Math.min(100 - elW, pos.x));
      const clampedY = Math.max(0, Math.min(100 - elH, pos.y));
      const snapped = getSnappedPos(clampedX, clampedY, elW, elH);
      setElements(prev => prev.map(e => e.id === id ? { ...e, x: snapped.x, y: snapped.y } : e));
    }

    // Fix 1: only open sheet on tap (no movement) on mobile
    if (isMobile && !dragMovedRef.current && (id || draggingRef.current)) {
      setSheetOpen(true);
    }

    draggingRef.current = null;
    dragPosRef.current = null;
    dragElementRef.current = null;
    dragMovedRef.current = false;
    setActiveGuides({ x: [], y: [] });
  };

  // Mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const now = Date.now();
    const c = getCanvasCoords(e.clientX, e.clientY);
    if (c) {
      const el = hitTest(c.mx, c.my, c.canvas);
      if (el && lastTapRef.current.id === el.id && now - lastTapRef.current.time < 400) {
        setTimeout(() => textInputRef.current?.focus(), 50);
        lastTapRef.current = { time: 0, id: null };
        return;
      }
      lastTapRef.current = { time: now, id: el?.id || null };
    }
    startDrag(e.clientX, e.clientY);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingRef.current) {
      moveDrag(e.clientX, e.clientY);
    } else {
      if (!isMobile) {
        const c = getCanvasCoords(e.clientX, e.clientY);
        if (c) {
          const el = hitTest(c.mx, c.my, c.canvas);
          setHoveredId(el?.id || null);
        }
      }
    }
  };

  const handleCanvasMouseUp = () => endDrag();

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0]; if (!t) return;
    const now = Date.now();
    const c = getCanvasCoords(t.clientX, t.clientY);
    if (c) {
      const el = hitTest(c.mx, c.my, c.canvas);
      if (el && lastTapRef.current.id === el.id && now - lastTapRef.current.time < 400) {
        setTimeout(() => textInputRef.current?.focus(), 50);
        lastTapRef.current = { time: 0, id: null };
        e.preventDefault();
        return;
      }
      lastTapRef.current = { time: now, id: el?.id || null };
    }
    const hit = startDrag(t.clientX, t.clientY);
    if (hit) {
      e.preventDefault();
    }
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const t = e.touches[0]; if (!t) return;
    moveDrag(t.clientX, t.clientY);
  };
  const handleTouchEnd = () => endDrag();

  // ── Element CRUD ──
  const addElement = (type: OverlayElement["type"]) => {
    pushStructuralSnapshot();
    const id = `${type}-${Date.now()}`;
    const defaults: Record<string, Partial<OverlayElement>> = {
      headline: { text: "Título", fontSize: 28, color: headlineColor, bold: true, x: 10, y: 10, width: 40 },
      subheadline: { text: "Subtítulo", fontSize: 18, color: headlineColor, x: 10, y: 25, width: 40 },
      bullet: { text: "✓ Item", fontSize: 16, color: headlineColor, x: 10, y: 40, width: 40 },
      badge: { text: "Badge", fontSize: 14, color: "#FFFFFF", bgColor: accentColor, x: 10, y: 80 },
      arrow: { text: "Detalhe", fontSize: 14, color: headlineColor, x: 50, y: 50, rotation: -30 },
      circle: { width: 20, color: accentColor, x: 50, y: 50 },
    };
    setElements(prev => [...prev, { id, type, ...defaults[type] } as OverlayElement]);
    setSelectedId(id);
    if (isMobile) setSheetOpen(true);
  };

  const deleteElement = (id: string) => {
    pushStructuralSnapshot();
    setElements(prev => prev.filter(el => el.id !== id));
    setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (selectedId === id) { setSelectedId(null); setSheetOpen(false); }
  };

  const updateElement = (id: string, updates: Partial<OverlayElement>) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, ...updates } : el)));
  };

  const updateElementText = (id: string, text: string) => {
    pushTextSnapshot();
    setElements(prev => prev.map(el => (el.id === id ? { ...el, text } : el)));
  };

  const duplicateElement = (id: string) => {
    pushStructuralSnapshot();
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newEl: OverlayElement = {
      ...el,
      id: `${el.type}-${Date.now()}`,
      x: Math.min(95, el.x + 5),
      y: Math.min(95, el.y + 5),
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    pushStructuralSnapshot();
    setElements(prev => {
      const idx = prev.findIndex(el => el.id === id);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx + 1 : idx - 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  // ── Fix 5: Alignment & Distribution ──
  const alignElements = useCallback((axis: "x" | "y", align: "start" | "center" | "end") => {
    pushStructuralSnapshot();
    const ids = checkedIds.size >= 2 ? checkedIds : (selectedId ? new Set([selectedId]) : new Set<string>());
    if (ids.size === 0) return;

    const targets = elements.filter(el => ids.has(el.id));
    if (targets.length === 0) return;

    if (targets.length === 1) {
      // Align to canvas
      const el = targets[0];
      const size = getElSize(el);
      let val: number;
      if (axis === "x") {
        val = align === "start" ? 2 : align === "center" ? 50 - size.w / 2 : 98 - size.w;
      } else {
        val = align === "start" ? 2 : align === "center" ? 50 - size.h / 2 : 98 - size.h;
      }
      setElements(prev => prev.map(e => e.id === el.id ? { ...e, [axis]: Math.max(0, Math.min(100, val)) } : e));
    } else {
      // Align to group bounding box
      const sized = targets.map(el => ({ el, size: getElSize(el) }));
      if (axis === "x") {
        const minX = Math.min(...sized.map(s => s.el.x));
        const maxX = Math.max(...sized.map(s => s.el.x + s.size.w));
        setElements(prev => prev.map(e => {
          if (!ids.has(e.id)) return e;
          const s = sized.find(ss => ss.el.id === e.id);
          if (!s) return e;
          let newX: number;
          if (align === "start") newX = minX;
          else if (align === "center") newX = (minX + maxX) / 2 - s.size.w / 2;
          else newX = maxX - s.size.w;
          return { ...e, x: Math.max(0, Math.min(100 - s.size.w, newX)) };
        }));
      } else {
        const minY = Math.min(...sized.map(s => s.el.y));
        const maxY = Math.max(...sized.map(s => s.el.y + s.size.h));
        setElements(prev => prev.map(e => {
          if (!ids.has(e.id)) return e;
          const s = sized.find(ss => ss.el.id === e.id);
          if (!s) return e;
          let newY: number;
          if (align === "start") newY = minY;
          else if (align === "center") newY = (minY + maxY) / 2 - s.size.h / 2;
          else newY = maxY - s.size.h;
          return { ...e, y: Math.max(0, Math.min(100 - s.size.h, newY)) };
        }));
      }
    }
  }, [checkedIds, selectedId, elements, getElSize, pushStructuralSnapshot]);

  const distributeElements = useCallback((axis: "x" | "y") => {
    if (checkedIds.size < 3) return;
    pushStructuralSnapshot();
    const targets = elements.filter(el => checkedIds.has(el.id));
    const sized = targets.map(el => ({ el, size: getElSize(el) }));

    if (axis === "x") {
      sized.sort((a, b) => a.el.x - b.el.x);
      const minX = sized[0].el.x;
      const maxX = sized[sized.length - 1].el.x + sized[sized.length - 1].size.w;
      const totalW = sized.reduce((sum, s) => sum + s.size.w, 0);
      const gap = (maxX - minX - totalW) / (sized.length - 1);
      let currentX = minX;
      const updates: Record<string, number> = {};
      for (const s of sized) {
        updates[s.el.id] = currentX;
        currentX += s.size.w + gap;
      }
      setElements(prev => prev.map(e => updates[e.id] !== undefined ? { ...e, x: Math.max(0, Math.min(100, updates[e.id])) } : e));
    } else {
      sized.sort((a, b) => a.el.y - b.el.y);
      const minY = sized[0].el.y;
      const maxY = sized[sized.length - 1].el.y + sized[sized.length - 1].size.h;
      const totalH = sized.reduce((sum, s) => sum + s.size.h, 0);
      const gap = (maxY - minY - totalH) / (sized.length - 1);
      let currentY = minY;
      const updates: Record<string, number> = {};
      for (const s of sized) {
        updates[s.el.id] = currentY;
        currentY += s.size.h + gap;
      }
      setElements(prev => prev.map(e => updates[e.id] !== undefined ? { ...e, y: Math.max(0, Math.min(100, updates[e.id])) } : e));
    }
  }, [checkedIds, elements, getElSize, pushStructuralSnapshot]);

  // ── Fix 2: Group property update ──
  const updateCheckedElements = useCallback((updates: Partial<OverlayElement>) => {
    pushStructuralSnapshot();
    setElements(prev => prev.map(el => checkedIds.has(el.id) ? { ...el, ...updates } : el));
  }, [checkedIds, pushStructuralSnapshot]);

  const deleteCheckedElements = useCallback(() => {
    pushStructuralSnapshot();
    setElements(prev => prev.filter(el => !checkedIds.has(el.id)));
    setCheckedIds(new Set());
    setSelectedId(null);
    setSheetOpen(false);
  }, [checkedIds, pushStructuralSnapshot]);

  // ── AI copy (Fix 3: badge mapping) ──
  const generateCopy = async (targetIds?: string[]) => {
    setGeneratingCopy(true);
    try {
      const roleKey = role?.role || "benefits";
      const previousCopies = getAllOverlayCopies();

      let targetElements: string[] | undefined;
      if (targetIds && targetIds.length > 0) {
        targetElements = [...new Set(
          elements.filter(el => targetIds.includes(el.id)).map(el => el.type)
        )];
      }

      const { data, error } = await supabase.functions.invoke("generate-overlay-copy", {
        body: { productName, characteristics, imageRole: roleKey, imageIndex, previousCopies, targetElements },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      pushStructuralSnapshot();

      const idsToUpdate = targetIds && targetIds.length > 0 ? new Set(targetIds) : null;

      if (data?.headline) {
        setElements(prev =>
          prev.map(el => {
            if (el.type !== "headline") return el;
            if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
            return { ...el, text: data.headline };
          })
        );
      }
      // Fix 3: subheadline only maps to subheadline (not badge)
      if (data?.subheadline) {
        setElements(prev =>
          prev.map(el => {
            if (el.type !== "subheadline") return el;
            if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
            return { ...el, text: data.subheadline };
          })
        );
      }
      // Fix 3: badges get their own mapping
      if (data?.badges && Array.isArray(data.badges)) {
        setElements(prev => {
          const badgeEls = prev.filter(el => el.type === "badge");
          const targetBadges = idsToUpdate
            ? badgeEls.filter(el => idsToUpdate.has(el.id))
            : badgeEls;

          const badgeTexts = data.badges.slice(0, targetBadges.length || 5) as string[];
          return prev.map(el => {
            if (el.type !== "badge") return el;
            if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
            const idx = targetBadges.indexOf(el);
            if (idx >= 0 && idx < badgeTexts.length) {
              return { ...el, text: badgeTexts[idx] };
            }
            return el;
          });
        });
      }
      if (data?.bullets && Array.isArray(data.bullets)) {
        setElements(prev => {
          const bulletEls = prev.filter(el => el.type === "bullet");
          const targetBullets = idsToUpdate
            ? bulletEls.filter(el => idsToUpdate.has(el.id))
            : bulletEls;

          const bulletTexts = data.bullets.slice(0, targetBullets.length || 5) as string[];
          const updated = prev.map(el => {
            if (el.type !== "bullet") return el;
            if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
            const idx = targetBullets.indexOf(el);
            if (idx >= 0 && idx < bulletTexts.length) {
              return { ...el, text: bulletTexts[idx] };
            }
            return el;
          });

          // Only create new bullets if there are no badge-only templates
          if (!idsToUpdate) {
            const hasBadges = prev.some(el => el.type === "badge");
            const hasBullets = bulletEls.length > 0;
            // Don't create new bullets if the template only has badges
            if (hasBullets || !hasBadges) {
              const existingBulletCount = bulletEls.length;
              for (let i = existingBulletCount; i < bulletTexts.length && i < 5; i++) {
                updated.push({
                  id: `bullet-gen-${Date.now()}-${i}`,
                  type: "bullet",
                  text: bulletTexts[i],
                  x: 5, y: 35 + i * 10, width: 40,
                  fontSize: 16, color: headlineColor,
                });
              }
            }
          }
          return updated;
        });
      }

      toast({ title: "Copy gerado com sucesso!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Generate copy error:", err);
      toast({ title: "Erro ao gerar copy", description: msg, variant: "destructive" });
    } finally {
      setGeneratingCopy(false);
    }
  };

  const generateSingleCopy = async (elementId: string) => {
    setGeneratingElementId(elementId);
    try {
      await generateCopy([elementId]);
    } finally {
      setGeneratingElementId(null);
    }
  };

  // ── Export ──
  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);
    try {
      setHoveredId(null);
      setActiveGuides({ x: [], y: [] });
      const savedSelected = selectedId;
      setSelectedId(null);
      await new Promise(r => setTimeout(r, 50));
      renderCanvas();

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png", 1.0));
      if (!blob) throw new Error("Failed to create image blob");

      const path = `overlays/${crypto.randomUUID()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(path, blob, { contentType: "image/png", upsert: false });
      if (uploadErr) {
        setSelectedId(savedSelected);
        throw uploadErr;
      }

      const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(path);
      onSaveOverlay(urlData.publicUrl);
      toast({ title: "Imagem com overlay salva!" });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Export overlay error:", err);
      toast({ title: "Erro ao exportar", description: msg, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  // ── Counts ──
  const textTypes = new Set(["headline", "subheadline", "bullet", "badge", "arrow"]);
  const checkedTextElements = elements.filter(el => checkedIds.has(el.id) && textTypes.has(el.type));
  const checkedCount = checkedTextElements.length;
  const checkedAnyCount = checkedIds.size;

  // ── Color presets ──
  const colorPresets = [headlineColor, accentColor, "#000000", "#FFFFFF", "#6B7280"];

  // ── UI Pieces ──

  const canvasElement = (
    <div
      ref={containerRef}
      className={`relative border rounded-lg overflow-hidden bg-muted aspect-square${!isMobile ? " max-h-full max-w-full" : ""}`}
      style={isMobile && canvasSize > 0 ? { width: canvasSize, height: canvasSize, margin: "0 auto" } : undefined}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        style={{ touchAction: "pan-y" }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={() => { handleCanvasMouseUp(); setHoveredId(null); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div
        className={`absolute top-2 left-2 transition-opacity duration-500 ${showDragBadge ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <Badge variant="secondary" className="text-xs">
          <Move className="w-3 h-3 mr-1" /> Arraste para mover
        </Badge>
      </div>
    </div>
  );

  const toolbarElement = (
    <div className={`grid gap-1.5 ${isMobile ? "grid-cols-3" : "grid-cols-2"}`}>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => addElement("headline")}>
        <Type className="w-3 h-3" /> Título
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => addElement("bullet")}>
        <Plus className="w-3 h-3" /> Bullet
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => addElement("badge")}>
        <Plus className="w-3 h-3" /> Badge
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => addElement("arrow")}>
        <ArrowRight className="w-3 h-3" /> Seta
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => addElement("circle")}>
        <Circle className="w-3 h-3" /> Círculo
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => addElement("subheadline")}>
        <Type className="w-3 h-3" /> Sub
      </Button>
    </div>
  );

  const undoRedoBar = (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={!canUndo} onClick={undo} title="Desfazer (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={!canRedo} onClick={redo} title="Refazer (Ctrl+Shift+Z)">
        <Redo2 className="w-4 h-4" />
      </Button>
    </div>
  );

  // ── Fix 5: Alignment Toolbar ──
  const showAlignTools = selectedId || checkedIds.size >= 2;
  const alignmentToolbar = showAlignTools ? (
    <div className="bg-muted/50 rounded-lg p-2 border space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {checkedIds.size >= 2 ? `Alinhar grupo (${checkedIds.size})` : "Alinhar ao canvas"}
      </p>
      <div className="flex items-center gap-1 flex-wrap">
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Esquerda"
          onClick={() => alignElements("x", "start")}>
          <AlignHorizontalJustifyStart className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Centro H"
          onClick={() => alignElements("x", "center")}>
          <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Direita"
          onClick={() => alignElements("x", "end")}>
          <AlignHorizontalJustifyEnd className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Topo"
          onClick={() => alignElements("y", "start")}>
          <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Centro V"
          onClick={() => alignElements("y", "center")}>
          <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Embaixo"
          onClick={() => alignElements("y", "end")}>
          <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
        </Button>
        {checkedIds.size >= 3 && (
          <>
            <div className="w-px h-6 bg-border mx-0.5" />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Distribuir H"
              onClick={() => distributeElements("x")}>
              <AlignHorizontalSpaceBetween className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Distribuir V"
              onClick={() => distributeElements("y")}>
              <AlignVerticalSpaceBetween className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  ) : null;

  // ── Fix 2: Group Edit Panel ──
  const groupEditPanel = checkedAnyCount >= 2 ? (
    <div className="bg-muted/50 rounded-lg p-3 border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          Edição em grupo ({checkedAnyCount})
        </p>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive"
          onClick={deleteCheckedElements}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Deletar todos
        </Button>
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Cor</label>
        <div className="flex items-center gap-2">
          {colorPresets.map((c, i) => (
            <ColorSwatch key={i} color={c} active={false}
              onClick={() => updateCheckedElements({ color: c })} />
          ))}
          <Input type="color" value={headlineColor}
            onChange={e => updateCheckedElements({ color: e.target.value })}
            className="h-8 w-8 p-0 border-0 cursor-pointer" />
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Tamanho</label>
        <Slider
          value={[16]}
          onValueChange={([v]) => {
            setElements(prev => prev.map(el => checkedIds.has(el.id) ? { ...el, fontSize: v } : el));
          }}
          onValueCommit={() => pushStructuralSnapshot()}
          min={8} max={72} step={1} className="w-full"
        />
      </div>

      {/* Bold */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1 text-xs"
          onClick={() => updateCheckedElements({ bold: true })}>
          <Bold className="w-3.5 h-3.5" /> Bold On
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1 text-xs"
          onClick={() => updateCheckedElements({ bold: false })}>
          Bold Off
        </Button>
      </div>

      {/* Opacity */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Opacidade</label>
        <Slider
          value={[100]}
          onValueChange={([v]) => {
            setElements(prev => prev.map(el => checkedIds.has(el.id) ? { ...el, opacity: v } : el));
          }}
          onValueCommit={() => pushStructuralSnapshot()}
          min={0} max={100} step={5} className="w-full"
        />
      </div>
    </div>
  ) : null;

  // ── Layer List ──
  const layerList = (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5" /> Elementos ({elements.length})
        </p>
        {undoRedoBar}
      </div>
      <ScrollArea className="max-h-[220px]">
        <div className="space-y-1">
          {elements.map((el, idx) => {
            const isSelected = el.id === selectedId;
            const isChecked = checkedIds.has(el.id);
            const hasTextContent = textTypes.has(el.type);
            const isGenerating = generatingElementId === el.id;

            return (
              <div
                key={el.id}
                className={`flex items-center gap-2 px-2 py-2.5 rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "hover:bg-muted/80"
                }`}
                onClick={() => {
                  setSelectedId(el.id);
                  if (isMobile) setSheetOpen(true);
                }}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleCheck(el.id)}
                  onClick={e => e.stopPropagation()}
                  className="shrink-0"
                />

                <LayerIcon type={el.type} />

                <span className="text-xs truncate flex-1 text-foreground">
                  {el.text ? `"${el.text}"` : el.type}
                </span>

                {!isMobile && (
                  <>
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={idx >= elements.length - 1}
                      onClick={e => { e.stopPropagation(); moveLayer(el.id, "up"); }}
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={idx <= 0}
                      onClick={e => { e.stopPropagation(); moveLayer(el.id, "down"); }}
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                    {hasTextContent && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-9 w-9 shrink-0"
                        disabled={isGenerating || generatingCopy}
                        onClick={e => { e.stopPropagation(); generateSingleCopy(el.id); }}
                        title="Regenerar texto com IA"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={e => { e.stopPropagation(); duplicateElement(el.id); }}
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}

                <Button
                  type="button" variant="ghost" size="icon"
                  className="h-9 w-9 shrink-0 text-destructive/60 hover:text-destructive"
                  onClick={e => { e.stopPropagation(); deleteElement(el.id); }}
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
          {elements.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              Nenhum elemento. Use os botões acima para adicionar.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // ── AI button ──
  const aiCopyButton = imageIndex > 1 ? (
    <Button
      size="sm"
      variant="outline"
      className="w-full text-xs gap-1.5 h-10"
      onClick={() => generateCopy(checkedCount > 0 ? [...checkedIds] : undefined)}
      disabled={generatingCopy}
    >
      {generatingCopy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      {generatingCopy
        ? "Gerando copy..."
        : checkedCount > 0
          ? `Gerar IA p/ selecionados (${checkedCount})`
          : "Gerar texto com IA (todos)"
      }
    </Button>
  ) : null;

  // ── Properties panel ──
  const hasText = selectedElement && textTypes.has(selectedElement.type);
  const hasWidth = selectedElement && (
    selectedElement.type === "headline" ||
    selectedElement.type === "subheadline" ||
    selectedElement.type === "bullet"
  );
  const hasRotation = selectedElement && (
    selectedElement.type === "arrow" || selectedElement.type === "circle"
  );
  const canBold = selectedElement && (
    selectedElement.type === "headline" ||
    selectedElement.type === "subheadline" ||
    selectedElement.type === "bullet"
  );
  const canAlign = canBold;
  const canTextStyle = canBold;

  const elementEditor = selectedElement ? (
    <div className="bg-muted/50 rounded-lg p-3 space-y-3 border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          {selectedElement.type}
        </p>
        {isMobile && (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => duplicateElement(selectedElement.id)} title="Duplicar">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            {textTypes.has(selectedElement.type) && (
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
                disabled={generatingElementId === selectedElement.id || generatingCopy}
                onClick={() => generateSingleCopy(selectedElement.id)} title="IA">
                {generatingElementId === selectedElement.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Sparkles className="w-3.5 h-3.5" />}
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => moveLayer(selectedElement.id, "up")} title="↑ z-index">
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => moveLayer(selectedElement.id, "down")} title="↓ z-index">
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {hasText && (
        <Input
          ref={textInputRef}
          value={selectedElement.text || ""}
          onChange={e => updateElementText(selectedElement.id, e.target.value)}
          onFocus={e => {
            if (isMobile) {
              setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
            }
          }}
          placeholder="Texto..."
          className="text-sm"
        />
      )}

      {(canBold || canAlign) && (
        <div className="flex items-center gap-1">
          {canBold && (
            <Button
              type="button"
              variant={selectedElement.bold ? "default" : "outline"}
              size="sm"
              className="h-9 gap-1 text-xs"
              onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { bold: !selectedElement.bold }); }}
            >
              <Bold className="w-3.5 h-3.5" />
            </Button>
          )}
          {canAlign && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <Button type="button" size="sm" className="h-9 w-9 p-0"
                variant={(!selectedElement.textAlign || selectedElement.textAlign === "left") ? "default" : "outline"}
                onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { textAlign: "left" }); }}>
                <AlignLeft className="w-3.5 h-3.5" />
              </Button>
              <Button type="button" size="sm" className="h-9 w-9 p-0"
                variant={selectedElement.textAlign === "center" ? "default" : "outline"}
                onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { textAlign: "center" }); }}>
                <AlignCenter className="w-3.5 h-3.5" />
              </Button>
              <Button type="button" size="sm" className="h-9 w-9 p-0"
                variant={selectedElement.textAlign === "right" ? "default" : "outline"}
                onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { textAlign: "right" }); }}>
                <AlignRight className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      )}

      {canTextStyle && (
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" className="h-9 text-xs px-2"
            variant={(!selectedElement.textStyle || selectedElement.textStyle === "none") ? "outline" : "ghost"}
            onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { textStyle: "none" }); }}>
            Normal
          </Button>
          <Button type="button" size="sm" className="h-9 text-xs px-2"
            variant={selectedElement.textStyle === "shadow" ? "default" : "outline"}
            onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { textStyle: "shadow" }); }}>
            Sombra
          </Button>
          <Button type="button" size="sm" className="h-9 text-xs px-2"
            variant={selectedElement.textStyle === "stroke" ? "default" : "outline"}
            onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { textStyle: "stroke" }); }}>
            Contorno
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <NumberStepper
          label="Tamanho"
          value={selectedElement.fontSize || 16}
          onChange={v => { pushStructuralSnapshot(); updateElement(selectedElement.id, { fontSize: v }); }}
          min={8} max={72} step={2}
        />
        <Slider
          value={[selectedElement.fontSize || 16]}
          onValueChange={([v]) => updateElement(selectedElement.id, { fontSize: v })}
          onValueCommit={() => pushStructuralSnapshot()}
          min={8} max={72} step={1} className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberStepper
          label="X (%)"
          value={Math.round(selectedElement.x)}
          onChange={v => updateElement(selectedElement.id, { x: v })}
          min={0} max={100} step={1}
        />
        <NumberStepper
          label="Y (%)"
          value={Math.round(selectedElement.y)}
          onChange={v => updateElement(selectedElement.id, { y: v })}
          min={0} max={100} step={1}
        />
      </div>

      {hasWidth && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Largura: {selectedElement.width || 40}%</span>
          <Slider
            value={[selectedElement.width || 40]}
            onValueChange={([v]) => updateElement(selectedElement.id, { width: v })}
            min={20} max={90} step={5} className="w-full"
          />
        </div>
      )}

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Opacidade: {selectedElement.opacity ?? 100}%</span>
        <Slider
          value={[selectedElement.opacity ?? 100]}
          onValueChange={([v]) => updateElement(selectedElement.id, { opacity: v })}
          min={0} max={100} step={5} className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Cor</label>
        <div className="flex items-center gap-2">
          {colorPresets.map((c, i) => (
            <ColorSwatch
              key={i}
              color={c}
              active={(selectedElement.color || headlineColor) === c}
              onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { color: c }); }}
            />
          ))}
          <Input
            type="color"
            value={selectedElement.color || headlineColor}
            onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
            className="h-8 w-8 p-0 border-0 cursor-pointer"
          />
        </div>
      </div>

      {selectedElement.type === "badge" && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Cor do fundo</label>
          <div className="flex items-center gap-2">
            {colorPresets.map((c, i) => (
              <ColorSwatch
                key={i}
                color={c}
                active={(selectedElement.bgColor || accentColor) === c}
                onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { bgColor: c }); }}
              />
            ))}
            <Input
              type="color"
              value={selectedElement.bgColor || accentColor}
              onChange={e => updateElement(selectedElement.id, { bgColor: e.target.value })}
              className="h-8 w-8 p-0 border-0 cursor-pointer"
            />
          </div>
        </div>
      )}

      {hasRotation && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Rotação</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-11 px-3 text-xs"
              onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { rotation: Math.max(-180, (selectedElement.rotation || 0) - 15) }); }}>
              −15°
            </Button>
            <span className="min-w-[4ch] text-center font-mono text-sm tabular-nums">
              {selectedElement.rotation || 0}°
            </span>
            <Button type="button" variant="outline" size="sm" className="h-11 px-3 text-xs"
              onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { rotation: Math.min(180, (selectedElement.rotation || 0) + 15) }); }}>
              +15°
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11"
              onClick={() => { pushStructuralSnapshot(); updateElement(selectedElement.id, { rotation: 0 }); }} title="Resetar rotação">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  const exportButton = (
    <Button className="w-full h-12 gap-2 font-semibold" onClick={handleExport} disabled={exporting}>
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? "Exportando..." : "Salvar imagem com overlay"}
    </Button>
  );

  // ── MOBILE: fullscreen layout with bottom sheet ──
  if (isMobile) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
          <h2 className="text-sm font-bold flex items-center gap-2 truncate">
            <Type className="w-4 h-4 shrink-0" />
            Overlay — {role?.label || `#${imageIndex}`}
          </h2>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="shrink-0 px-3 pt-3">
          {canvasElement}
        </div>

        <div className="shrink-0 px-3 py-2">
          {toolbarElement}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3">
          <Collapsible open={layersOpen} onOpenChange={setLayersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-10">
                <span className="flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" />
                  Elementos
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{elements.length}</Badge>
                </span>
                <ChevronsDown className={`w-3.5 h-3.5 transition-transform ${layersOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {layerList}
            </CollapsibleContent>
          </Collapsible>
          {alignmentToolbar}
          {groupEditPanel}
          {aiCopyButton}
        </div>

        <div className="shrink-0 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t bg-background">
          {exportButton}
        </div>

        <Sheet open={sheetOpen && !!selectedElement} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-sm">Propriedades</SheetTitle>
            </SheetHeader>
            <div className="pt-2">
              {elementEditor}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // ── DESKTOP: Dialog with 2-column layout ──
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Type className="w-4 h-4" />
            Editor de Overlay — {role?.label || `Imagem #${imageIndex}`}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[1fr_340px] gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="min-h-0 overflow-hidden flex items-center justify-center">
            {canvasElement}
          </div>
          <div className="min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {toolbarElement}
                {layerList}
                {alignmentToolbar}
                {groupEditPanel}
                {aiCopyButton}
                {elementEditor}
                {exportButton}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
