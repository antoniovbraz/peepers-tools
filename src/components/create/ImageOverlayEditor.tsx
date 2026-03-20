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

export default function ImageOverlayEditor({
  open, onClose, imageUrl, imageIndex,
  headlineColor, accentColor, productName, characteristics, onSaveOverlay,
}: ImageOverlayEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<OverlayElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatingElementId, setGeneratingElementId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const { updateOverlayElements, getOverlayElements, getAllOverlayCopies } = useCreateListing();

  // rAF drag refs
  const draggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const role = IMAGE_ROLES[imageIndex - 1];

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

  // Load base image
  useEffect(() => {
    if (!imageUrl || !open) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedImage(img);
    img.onerror = () => console.error("Failed to load image for overlay");
    img.src = imageUrl;
  }, [imageUrl, open]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;
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

      // Selection indicator
      if (el.id === selectedId) {
        ctx.strokeStyle = "hsl(217.2 91.2% 59.8%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px - 6, py - 6, 12, 12);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }, [elements, loadedImage, selectedId, headlineColor, accentColor]);

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

  const hitTest = (mx: number, my: number, canvas: HTMLCanvasElement) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const ex = (el.x / 100) * canvas.width;
      const ey = (el.y / 100) * canvas.height;
      if (Math.abs(mx - ex) < 50 && Math.abs(my - ey) < 50) return el;
    }
    return null;
  };

  const startDrag = (clientX: number, clientY: number) => {
    const c = getCanvasCoords(clientX, clientY);
    if (!c) return;
    const el = hitTest(c.mx, c.my, c.canvas);
    if (el) {
      setSelectedId(el.id);
      draggingRef.current = el.id;
      dragOffsetRef.current = { x: c.mx - (el.x / 100) * c.canvas.width, y: c.my - (el.y / 100) * c.canvas.height };
    } else {
      setSelectedId(null);
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
    // Final commit
    const pos = dragPosRef.current;
    const id = draggingRef.current;
    if (pos && id) {
      setElements(prev => prev.map(el => el.id === id ? { ...el, x: pos.x, y: pos.y } : el));
    }
    draggingRef.current = null;
    dragPosRef.current = null;
  };

  // Mouse/touch handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => startDrag(e.clientX, e.clientY);
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => moveDrag(e.clientX, e.clientY);
  const handleCanvasMouseUp = () => endDrag();
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0]; if (!t) return;
    startDrag(t.clientX, t.clientY);
    if (draggingRef.current) e.preventDefault();
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

  const selectedElement = elements.find(el => el.id === selectedId);

  // ── AI copy — full or selective ──
  const generateCopy = async (targetIds?: string[]) => {
    setGeneratingCopy(true);
    try {
      const roleKey = role?.role || "benefits";
      const previousCopies = getAllOverlayCopies();

      // Determine which element types to target
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

      // Apply only to targeted elements (or all if no targets)
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
          const updatedBulletIds = new Set<string>();

          const updated = prev.map(el => {
            if (el.type !== "bullet") return el;
            if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
            const idx = targetBullets.indexOf(el);
            if (idx >= 0 && idx < bulletTexts.length) {
              updatedBulletIds.add(el.id);
              return { ...el, text: bulletTexts[idx] };
            }
            return el;
          });

          // If no targets and fewer bullets exist than generated, add new ones
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

  // ── AI for single element ──
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
  const canvasElement = (
    <div className="relative border rounded-lg overflow-hidden bg-muted">
      <canvas
        ref={canvasRef}
        className={`w-full cursor-move ${isMobile ? "max-h-[50vh]" : ""}`}
        style={{ touchAction: "none" }}
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

  // ── Layer List ──
  const layerList = (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <ListChecks className="w-3.5 h-3.5" /> Elementos ({elements.length})
      </p>
      <ScrollArea className="max-h-[180px]">
        <div className="space-y-1">
          {elements.map(el => {
            const isSelected = el.id === selectedId;
            const isChecked = checkedIds.has(el.id);
            const hasTextContent = textTypes.has(el.type);
            const isGenerating = generatingElementId === el.id;

            return (
              <div
                key={el.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "hover:bg-muted/80"
                }`}
                onClick={() => setSelectedId(el.id)}
              >
                {/* Checkbox for AI selection */}
                {hasTextContent && (
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleCheck(el.id)}
                    onClick={e => e.stopPropagation()}
                    className="shrink-0"
                  />
                )}
                {!hasTextContent && <div className="w-4 shrink-0" />}

                {/* Icon */}
                <LayerIcon type={el.type} />

                {/* Text preview */}
                <span className="text-xs truncate flex-1 text-foreground">
                  {el.text ? `"${el.text}"` : el.type}
                </span>

                {/* Inline AI button */}
                {hasTextContent && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    disabled={isGenerating || generatingCopy}
                    onClick={e => { e.stopPropagation(); generateSingleCopy(el.id); }}
                    title="Regenerar texto com IA"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                  </Button>
                )}

                {/* Delete */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive/60 hover:text-destructive"
                  onClick={e => { e.stopPropagation(); deleteElement(el.id); }}
                  title="Remover"
                >
                  <Trash2 className="w-3 h-3" />
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

  const elementEditor = selectedElement ? (
    <div className="bg-muted/50 rounded-lg p-3 space-y-3 border">
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        Propriedades: {selectedElement.type}
      </p>

      {hasText && (
        <Input
          value={selectedElement.text || ""}
          onChange={e => updateElement(selectedElement.id, { text: e.target.value })}
          placeholder="Texto..."
          className="text-sm"
        />
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

  // ── DESKTOP: Dialog ──
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Type className="w-4 h-4" />
            Editor de Overlay — {role?.label || `Imagem #${imageIndex}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {canvasElement}
          {toolbarElement}
          {layerList}
          {aiCopyButton}
          {elementEditor}
          {exportButton}
        </div>
      </DialogContent>
    </Dialog>
  );
}
