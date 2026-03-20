import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Type, Plus, Trash2, Download, Loader2, Sparkles, Move,
  ArrowRight, Circle, RotateCw, X, Minus,
} from "lucide-react";
import { OverlayElement, getDefaultTemplate, IMAGE_ROLES } from "@/lib/overlayTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

/* ── NumberStepper ── */
function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => onChange(clamp(value - step))}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="min-w-[3ch] text-center font-mono text-sm tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => onChange(clamp(value + step))}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
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

export default function ImageOverlayEditor({
  open,
  onClose,
  imageUrl,
  imageIndex,
  headlineColor,
  accentColor,
  productName,
  characteristics,
  onSaveOverlay,
}: ImageOverlayEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<OverlayElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const isMobile = useIsMobile();

  const role = IMAGE_ROLES[imageIndex - 1];

  // Load template on open
  useEffect(() => {
    if (open) {
      const template = getDefaultTemplate(imageIndex, headlineColor, accentColor);
      setElements(template);
      setSelectedId(null);
    }
  }, [open, imageIndex, headlineColor, accentColor]);

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

    const W = 1080;
    const H = 1080;
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
          const padX = 12;
          const padY = 8;
          const bw = metrics.width + padX * 2;
          const bh = fontSize + padY * 2;

          const radius = bh / 2;
          ctx.fillStyle = el.bgColor || accentColor;
          ctx.beginPath();
          ctx.roundRect(px, py, bw, bh, radius);
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

      if (el.id === selectedId) {
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px - 6, py - 6, 12, 12);
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  }, [elements, loadedImage, selectedId, headlineColor, accentColor]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ── Pointer helpers ──
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      mx: (clientX - rect.left) * scaleX,
      my: (clientY - rect.top) * scaleY,
      canvas,
    };
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

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = getCanvasCoords(e.clientX, e.clientY);
    if (!c) return;
    const el = hitTest(c.mx, c.my, c.canvas);
    if (el) {
      setSelectedId(el.id);
      setDragging(el.id);
      setDragOffset({ x: c.mx - (el.x / 100) * c.canvas.width, y: c.my - (el.y / 100) * c.canvas.height });
    } else {
      setSelectedId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const c = getCanvasCoords(e.clientX, e.clientY);
    if (!c) return;
    setElements(prev =>
      prev.map(el =>
        el.id === dragging
          ? {
              ...el,
              x: Math.max(0, Math.min(100, ((c.mx - dragOffset.x) / c.canvas.width) * 100)),
              y: Math.max(0, Math.min(100, ((c.my - dragOffset.y) / c.canvas.height) * 100)),
            }
          : el
      )
    );
  };

  const handleCanvasMouseUp = () => setDragging(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const c = getCanvasCoords(touch.clientX, touch.clientY);
    if (!c) return;
    const el = hitTest(c.mx, c.my, c.canvas);
    if (el) {
      setSelectedId(el.id);
      setDragging(el.id);
      setDragOffset({ x: c.mx - (el.x / 100) * c.canvas.width, y: c.my - (el.y / 100) * c.canvas.height });
      e.preventDefault();
    } else {
      setSelectedId(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const c = getCanvasCoords(touch.clientX, touch.clientY);
    if (!c) return;
    setElements(prev =>
      prev.map(el =>
        el.id === dragging
          ? {
              ...el,
              x: Math.max(0, Math.min(100, ((c.mx - dragOffset.x) / c.canvas.width) * 100)),
              y: Math.max(0, Math.min(100, ((c.my - dragOffset.y) / c.canvas.height) * 100)),
            }
          : el
      )
    );
  };

  const handleTouchEnd = () => setDragging(null);

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

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const updateSelected = (updates: Partial<OverlayElement>) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => (el.id === selectedId ? { ...el, ...updates } : el)));
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  // ── AI copy ──
  const generateCopy = async () => {
    setGeneratingCopy(true);
    try {
      const roleKey = role?.role || "benefits";
      const { data, error } = await supabase.functions.invoke("generate-overlay-copy", {
        body: { productName, characteristics, imageRole: roleKey, imageIndex },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.headline) {
        setElements(prev =>
          prev.map(el => (el.type === "headline" ? { ...el, text: data.headline } : el))
        );
      }
      if (data?.bullets && Array.isArray(data.bullets)) {
        setElements(prev => {
          const bulletEls = prev.filter(el => el.type === "bullet");
          const nonBullets = prev.filter(el => el.type !== "bullet");
          const newBullets = data.bullets.slice(0, 5).map((text: string, i: number) => ({
            ...(bulletEls[i] || {
              id: `bullet-gen-${i}`,
              type: "bullet" as const,
              x: 5,
              y: 35 + i * 10,
              width: 40,
              fontSize: 16,
              color: headlineColor,
            }),
            text,
          }));
          return [...nonBullets, ...newBullets];
        });
      }

      toast({ title: "Copy gerado com sucesso!" });
    } catch (err: any) {
      console.error("Generate copy error:", err);
      toast({ title: "Erro ao gerar copy", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingCopy(false);
    }
  };

  // ── Export ──
  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setExporting(true);
    try {
      renderCanvas();

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );
      if (!blob) throw new Error("Failed to create image blob");

      const path = `overlays/${crypto.randomUUID()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(path, blob, { contentType: "image/png", upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("generated-images")
        .getPublicUrl(path);

      onSaveOverlay(urlData.publicUrl);
      toast({ title: "Imagem com overlay salva!" });
      onClose();
    } catch (err: any) {
      console.error("Export overlay error:", err);
      toast({ title: "Erro ao exportar", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  // ── Shared UI pieces ──
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
      {selectedId && (
        <Button size="sm" variant="destructive" className="text-xs gap-1 h-10" onClick={deleteSelected}>
          <Trash2 className="w-3 h-3" /> Remover
        </Button>
      )}
    </div>
  );

  const aiCopyButton = imageIndex > 1 ? (
    <Button
      size="sm"
      variant="outline"
      className="w-full text-xs gap-1 h-10"
      onClick={generateCopy}
      disabled={generatingCopy}
    >
      {generatingCopy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
      {generatingCopy ? "Gerando copy..." : "Gerar texto com IA"}
    </Button>
  ) : null;

  const hasText = selectedElement && (
    selectedElement.type === "headline" ||
    selectedElement.type === "subheadline" ||
    selectedElement.type === "bullet" ||
    selectedElement.type === "badge" ||
    selectedElement.type === "arrow"
  );

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
        Editando: {selectedElement.type}
      </p>

      {/* Text input */}
      {hasText && (
        <Input
          value={selectedElement.text || ""}
          onChange={e => updateSelected({ text: e.target.value })}
          placeholder="Texto..."
          className="text-sm"
        />
      )}

      {/* Font size — Stepper + Slider */}
      <div className="space-y-2">
        <NumberStepper
          label="Tamanho"
          value={selectedElement.fontSize || 16}
          onChange={v => updateSelected({ fontSize: v })}
          min={8}
          max={72}
          step={2}
        />
        <Slider
          value={[selectedElement.fontSize || 16]}
          onValueChange={([v]) => updateSelected({ fontSize: v })}
          min={8}
          max={72}
          step={1}
          className="w-full"
        />
      </div>

      {/* Width — Slider (only for text elements) */}
      {hasWidth && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">
            Largura: {selectedElement.width || 40}%
          </span>
          <Slider
            value={[selectedElement.width || 40]}
            onValueChange={([v]) => updateSelected({ width: v })}
            min={20}
            max={90}
            step={5}
            className="w-full"
          />
        </div>
      )}

      {/* Colors */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Cor</label>
          <Input
            type="color"
            value={selectedElement.color || headlineColor}
            onChange={e => updateSelected({ color: e.target.value })}
            className="h-11"
          />
        </div>
        {selectedElement.type === "badge" && (
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Fundo</label>
            <Input
              type="color"
              value={selectedElement.bgColor || accentColor}
              onChange={e => updateSelected({ bgColor: e.target.value })}
              className="h-11"
            />
          </div>
        )}
      </div>

      {/* Rotation — Stepper ±15° + reset */}
      {hasRotation && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Rotação</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 px-3 text-xs"
              onClick={() => updateSelected({ rotation: Math.max(-180, (selectedElement.rotation || 0) - 15) })}
            >
              −15°
            </Button>
            <span className="min-w-[4ch] text-center font-mono text-sm tabular-nums">
              {selectedElement.rotation || 0}°
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 px-3 text-xs"
              onClick={() => updateSelected({ rotation: Math.min(180, (selectedElement.rotation || 0) + 15) })}
            >
              +15°
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => updateSelected({ rotation: 0 })}
              title="Resetar rotação"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  const exportButton = (
    <Button
      className="w-full h-12 gap-2 font-semibold"
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? "Exportando..." : "Salvar imagem com overlay"}
    </Button>
  );

  // ── MOBILE: fullscreen layout ──
  if (isMobile) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Fixed header */}
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
          <h2 className="text-sm font-bold flex items-center gap-2 truncate">
            <Type className="w-4 h-4 shrink-0" />
            Overlay — {role?.label || `#${imageIndex}`}
          </h2>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-24">
          {canvasElement}
          {toolbarElement}
          {aiCopyButton}
          {elementEditor}
        </div>

        {/* Sticky bottom export */}
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
          {aiCopyButton}
          {elementEditor}
          {exportButton}
        </div>
      </DialogContent>
    </Dialog>
  );
}
