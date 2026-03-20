import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Type, Plus, Trash2, Download, Loader2, Sparkles, Move,
  ArrowRight, Circle, RotateCw, X, Minus, Tag, ListChecks,
  Bold, ChevronUp, ChevronDown, Undo2, Redo2,
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

/* ── Undo/Redo hook ── */
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
  headlineColor: string,
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
  const isMobile = useIsMobile();

  const { updateOverlayElements, getOverlayElements, getAllOverlayCopies } = useCreateListing();
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(elements, setElements);

  // rAF drag refs
  const draggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const touchActionRef = useRef<"pan-y" | "none">("pan-y");
  const prevElementsRef = useRef<OverlayElement[]>([]);

  const role = IMAGE_ROLES[imageIndex - 1];

  // Phase 3.4: Font loading
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // Phase 1.1: Dynamic canvas sizing
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (isMobile) {
        const vw = window.innerWidth - 24; // px-3 padding
        const vh = window.innerHeight * 0.5;
        setCanvasSize(Math.floor(Math.min(vw, vh)));
      } else {
        setCanvasSize(0); // desktop uses flex sizing
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, isMobile]);

  // Load template or persisted elements on open
  useEffect(() => {
    if (!open) return;
    const saved = getOverlayElements(imageIndex);
    if (saved && saved.length > 0) {
      setElements(saved as OverlayElement[]);
    } else {
      setElements(getDefaultTemplate(imageIndex, headlineColor, accentColor));
    }
    setSelectedId(null);
    setCheckedIds(new Set());
  }, [open, imageIndex, headlineColor, accentColor, getOverlayElements]);

  // Persist elements to context on change
  useEffect(() => {
    if (open && elements.length > 0) {
      updateOverlayElements(imageIndex, elements);
    }
  }, [elements, open, imageIndex, updateOverlayElements]);

  // Push undo snapshots when elements change meaningfully
  useEffect(() => {
    if (prevElementsRef.current.length > 0 && elements !== prevElementsRef.current) {
      pushSnapshot(prevElementsRef.current);
    }
    prevElementsRef.current = elements;
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

  // Phase 2.2: Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if typing in input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault(); undo(); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault(); redo(); return;
      }

      // Delete
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
        return;
      }
      // Escape
      if (e.key === "Escape") {
        setSelectedId(null); return;
      }
      // Arrow keys: move selected element
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
  }, [open, selectedId, undo, redo]);

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

    for (const el of elements) {
      const px = (el.x / 100) * W;
      const py = (el.y / 100) * H;
      const fontSize = el.fontSize || 16;
      ctx.save();

      if (el.rotation) {
        ctx.translate(px, py);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-px, -py);
      }

      switch (el.type) {
        case "headline":
        case "subheadline":
        case "bullet": {
          ctx.font = `${el.bold ? "bold " : ""}${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = el.color || headlineColor;
          ctx.textBaseline = "top";
          const maxWidth = el.width ? (el.width / 100) * W : W - px - 20;
          const words = (el.text || "").split(" ");
          let line = "";
          let lineY = py;
          const lineHeight = fontSize * 1.3;
          for (const word of words) {
            const test = line + (line ? " " : "") + word;
            if (ctx.measureText(test).width > maxWidth && line) {
              ctx.fillStyle = "rgba(255,255,255,0.7)";
              ctx.fillRect(px - 4, lineY - 2, ctx.measureText(line).width + 8, lineHeight);
              ctx.fillStyle = el.color || headlineColor;
              ctx.fillText(line, px, lineY);
              line = word;
              lineY += lineHeight;
            } else {
              line = test;
            }
          }
          if (line) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(px - 4, lineY - 2, ctx.measureText(line).width + 8, lineHeight);
            ctx.fillStyle = el.color || headlineColor;
            ctx.fillText(line, px, lineY);
          }
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

      // Phase 1.5: Real bounding box selection indicator
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
  }, [elements, loadedImage, selectedId, headlineColor, accentColor, fontsReady]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  // ── rAF drag loop ──
  const dragLoop = useCallback(() => {
    const pos = dragPosRef.current;
    const id = draggingRef.current;
    if (!pos || !id) return;

    setElements(prev =>
      prev.map(el => el.id === id ? { ...el, x: pos.x, y: pos.y } : el)
    );
    dragPosRef.current = null;
    rafRef.current = null;
  }, []);

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

  // Phase 3.1: Bounding box hit test
  const hitTest = (mx: number, my: number, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const W = canvas.width, H = canvas.height;
    // Phase 1.2: Scale threshold for mobile
    const threshold = isMobile ? 120 : 50;

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const bounds = getElementBounds(el, ctx, W, H, headlineColor);
      // Expand bounds by threshold for easier touch
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

  const startDrag = (clientX: number, clientY: number) => {
    const c = getCanvasCoords(clientX, clientY);
    if (!c) return false;
    const el = hitTest(c.mx, c.my, c.canvas);
    if (el) {
      setSelectedId(el.id);
      draggingRef.current = el.id;
      dragOffsetRef.current = { x: c.mx - (el.x / 100) * c.canvas.width, y: c.my - (el.y / 100) * c.canvas.height };
      return true;
    } else {
      setSelectedId(null);
      return false;
    }
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const c = getCanvasCoords(clientX, clientY);
    if (!c) return;
    dragPosRef.current = {
      x: Math.max(0, Math.min(100, ((c.mx - dragOffsetRef.current.x) / c.canvas.width) * 100)),
      y: Math.max(0, Math.min(100, ((c.my - dragOffsetRef.current.y) / c.canvas.height) * 100)),
    };
    scheduleRaf();
  };

  const endDrag = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const pos = dragPosRef.current;
    const id = draggingRef.current;
    if (pos && id) {
      setElements(prev => prev.map(el => el.id === id ? { ...el, x: pos.x, y: pos.y } : el));
    }
    draggingRef.current = null;
    dragPosRef.current = null;
    // Phase 1.3: restore touchAction
    touchActionRef.current = "pan-y";
  };

  // Mouse/touch handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => startDrag(e.clientX, e.clientY);
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => moveDrag(e.clientX, e.clientY);
  const handleCanvasMouseUp = () => endDrag();
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0]; if (!t) return;
    const hit = startDrag(t.clientX, t.clientY);
    if (hit) {
      // Phase 1.3: Only prevent scroll when dragging an element
      touchActionRef.current = "none";
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
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (selectedId === id) setSelectedId(null);
  };

  const updateElement = (id: string, updates: Partial<OverlayElement>) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, ...updates } : el)));
  };

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // Phase 4.2: Z-index reorder
  const moveLayer = (id: string, direction: "up" | "down") => {
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

  // ── AI copy — full or selective ──
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

      const idsToUpdate = targetIds && targetIds.length > 0
        ? new Set(targetIds)
        : null;

      if (data?.headline) {
        setElements(prev =>
          prev.map(el => {
            if (el.type !== "headline") return el;
            if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
            return { ...el, text: data.headline };
          })
        );
      }
      if (data?.subheadline) {
        setElements(prev =>
          prev.map(el => {
            if (el.type !== "subheadline" && el.type !== "badge") return el;
            if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
            return { ...el, text: data.subheadline };
          })
        );
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

          if (!idsToUpdate) {
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
      renderCanvas();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png", 1.0));
      if (!blob) throw new Error("Failed to create image blob");

      const path = `overlays/${crypto.randomUUID()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(path, blob, { contentType: "image/png", upsert: false });
      if (uploadErr) throw uploadErr;

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

  // ── Count checked with text ──
  const textTypes = new Set(["headline", "subheadline", "bullet", "badge", "arrow"]);
  const checkedTextElements = elements.filter(el => checkedIds.has(el.id) && textTypes.has(el.type));
  const checkedCount = checkedTextElements.length;

  // ── UI Pieces ──

  // Phase 1.1: Canvas with proper aspect ratio
  const canvasElement = (
    <div
      ref={containerRef}
      className="relative border rounded-lg overflow-hidden bg-muted aspect-square"
      style={isMobile && canvasSize > 0 ? { width: canvasSize, height: canvasSize, margin: "0 auto" } : undefined}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        style={{ touchAction: touchActionRef.current }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="absolute top-2 left-2">
        <Badge variant="secondary" className="text-xs">
          <Move className="w-3 h-3 mr-1" /> Arraste para mover
        </Badge>
      </div>
    </div>
  );

  const toolbarElement = (
    <div className="grid grid-cols-3 gap-1.5">
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

  // Phase 3.3: Undo/Redo toolbar
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

  // ── Layer List (Phase 4.1: bigger touch targets) ──
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
                onClick={() => setSelectedId(el.id)}
              >
                {hasTextContent && (
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleCheck(el.id)}
                    onClick={e => e.stopPropagation()}
                    className="shrink-0"
                  />
                )}
                {!hasTextContent && <div className="w-4 shrink-0" />}

                <LayerIcon type={el.type} />

                <span className="text-xs truncate flex-1 text-foreground">
                  {el.text ? `"${el.text}"` : el.type}
                </span>

                {/* Phase 4.2: Z-index controls */}
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

  const elementEditor = selectedElement ? (
    <div className="bg-muted/50 rounded-lg p-3 space-y-3 border">
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        Propriedades: {selectedElement.type}
      </p>

      {hasText && (
        <Input
          value={selectedElement.text || ""}
          onChange={e => updateElement(selectedElement.id, { text: e.target.value })}
          onFocus={e => {
            // Phase 1.4: scroll input into view on mobile
            if (isMobile) {
              setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
            }
          }}
          placeholder="Texto..."
          className="text-sm"
        />
      )}

      {/* Phase 3.2: Bold toggle */}
      {canBold && (
        <Button
          type="button"
          variant={selectedElement.bold ? "default" : "outline"}
          size="sm"
          className="h-10 gap-1.5 text-xs"
          onClick={() => updateElement(selectedElement.id, { bold: !selectedElement.bold })}
        >
          <Bold className="w-3.5 h-3.5" />
          {selectedElement.bold ? "Bold ativo" : "Bold"}
        </Button>
      )}

      <div className="space-y-2">
        <NumberStepper
          label="Tamanho"
          value={selectedElement.fontSize || 16}
          onChange={v => updateElement(selectedElement.id, { fontSize: v })}
          min={8} max={72} step={2}
        />
        <Slider
          value={[selectedElement.fontSize || 16]}
          onValueChange={([v]) => updateElement(selectedElement.id, { fontSize: v })}
          min={8} max={72} step={1} className="w-full"
        />
      </div>

      {/* Phase 2.3: X/Y position steppers */}
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

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Cor</label>
          <Input
            type="color"
            value={selectedElement.color || headlineColor}
            onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
            className="h-11"
          />
        </div>
        {selectedElement.type === "badge" && (
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Fundo</label>
            <Input
              type="color"
              value={selectedElement.bgColor || accentColor}
              onChange={e => updateElement(selectedElement.id, { bgColor: e.target.value })}
              className="h-11"
            />
          </div>
        )}
      </div>

      {hasRotation && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Rotação</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-11 px-3 text-xs"
              onClick={() => updateElement(selectedElement.id, { rotation: Math.max(-180, (selectedElement.rotation || 0) - 15) })}>
              −15°
            </Button>
            <span className="min-w-[4ch] text-center font-mono text-sm tabular-nums">
              {selectedElement.rotation || 0}°
            </span>
            <Button type="button" variant="outline" size="sm" className="h-11 px-3 text-xs"
              onClick={() => updateElement(selectedElement.id, { rotation: Math.min(180, (selectedElement.rotation || 0) + 15) })}>
              +15°
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11"
              onClick={() => updateElement(selectedElement.id, { rotation: 0 })} title="Resetar rotação">
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

  // ── MOBILE: fullscreen layout ──
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
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-24">
          {canvasElement}
          {toolbarElement}
          {layerList}
          {aiCopyButton}
          {elementEditor}
        </div>
        <div className="shrink-0 px-3 py-2 border-t bg-background">
          {exportButton}
        </div>
      </div>
    );
  }

  // ── DESKTOP: Dialog with 2-column layout (Phase 2.1) ──
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Type className="w-4 h-4" />
            Editor de Overlay — {role?.label || `Imagem #${imageIndex}`}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[1fr_320px] gap-4 min-h-0">
          {/* Left: Canvas */}
          <div className="min-h-0 flex flex-col">
            {canvasElement}
          </div>
          {/* Right: Controls */}
          <ScrollArea className="max-h-[calc(95vh-120px)]">
            <div className="space-y-3 pr-2">
              {toolbarElement}
              {layerList}
              {aiCopyButton}
              {elementEditor}
              {exportButton}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
