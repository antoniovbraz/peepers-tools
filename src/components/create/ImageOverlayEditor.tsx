import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Type, Plus, Trash2, Download, Loader2, Sparkles, Move,
  ArrowRight, Circle, RotateCw,
} from "lucide-react";
import { OverlayElement, getDefaultTemplate, IMAGE_ROLES } from "@/lib/overlayTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ImageOverlayEditorProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageIndex: number; // 1-7
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

    // Draw base image
    ctx.drawImage(loadedImage, 0, 0, W, H);

    // Draw elements
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

          // Word wrap
          const maxWidth = el.width ? (el.width / 100) * W : W - px - 20;
          const words = (el.text || "").split(" ");
          let line = "";
          let lineY = py;
          const lineHeight = fontSize * 1.3;

          for (const word of words) {
            const test = line + (line ? " " : "") + word;
            if (ctx.measureText(test).width > maxWidth && line) {
              // Draw shadow for readability
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

          // Rounded rect
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

          // Arrowhead
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

  // Mouse handlers for drag
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Find clicked element (reverse order = top first)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const ex = (el.x / 100) * canvas.width;
      const ey = (el.y / 100) * canvas.height;
      const hitSize = 50;
      if (Math.abs(mx - ex) < hitSize && Math.abs(my - ey) < hitSize) {
        setSelectedId(el.id);
        setDragging(el.id);
        setDragOffset({ x: mx - ex, y: my - ey });
        return;
      }
    }
    setSelectedId(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    setElements(prev =>
      prev.map(el =>
        el.id === dragging
          ? {
              ...el,
              x: Math.max(0, Math.min(100, ((mx - dragOffset.x) / canvas.width) * 100)),
              y: Math.max(0, Math.min(100, ((my - dragOffset.y) / canvas.height) * 100)),
            }
          : el
      )
    );
  };

  const handleCanvasMouseUp = () => setDragging(null);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !touch) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (touch.clientX - rect.left) * scaleX;
    const my = (touch.clientY - rect.top) * scaleY;

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const ex = (el.x / 100) * canvas.width;
      const ey = (el.y / 100) * canvas.height;
      if (Math.abs(mx - ex) < 50 && Math.abs(my - ey) < 50) {
        setSelectedId(el.id);
        setDragging(el.id);
        setDragOffset({ x: mx - ex, y: my - ey });
        e.preventDefault();
        return;
      }
    }
    setSelectedId(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !touch) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (touch.clientX - rect.left) * scaleX;
    const my = (touch.clientY - rect.top) * scaleY;

    setElements(prev =>
      prev.map(el =>
        el.id === dragging
          ? {
              ...el,
              x: Math.max(0, Math.min(100, ((mx - dragOffset.x) / canvas.width) * 100)),
              y: Math.max(0, Math.min(100, ((my - dragOffset.y) / canvas.height) * 100)),
            }
          : el
      )
    );
  };

  const handleTouchEnd = () => setDragging(null);

  // Add element
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

  // Generate AI copy
  const generateCopy = async () => {
    setGeneratingCopy(true);
    try {
      const roleKey = role?.role || "benefits";
      const { data, error } = await supabase.functions.invoke("generate-overlay-copy", {
        body: {
          productName,
          characteristics,
          imageRole: roleKey,
          imageIndex,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Apply generated copy to elements
      if (data?.headline) {
        const headlineEl = elements.find(el => el.type === "headline");
        if (headlineEl) {
          updateSelected({ text: data.headline });
          setElements(prev =>
            prev.map(el => (el.type === "headline" ? { ...el, text: data.headline } : el))
          );
        }
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

  // Export final image
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

      // Upload to storage
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

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto p-3 sm:p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Type className="w-4 h-4" />
            Editor de Overlay — {role?.label || `Imagem #${imageIndex}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Canvas preview */}
          <div className="relative border rounded-lg overflow-hidden bg-muted">
            <canvas
              ref={canvasRef}
              className="w-full cursor-move"
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

          {/* Toolbar */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => addElement("headline")}>
              <Type className="w-3 h-3" /> Título
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => addElement("bullet")}>
              <Plus className="w-3 h-3" /> Bullet
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => addElement("badge")}>
              <Plus className="w-3 h-3" /> Badge
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => addElement("arrow")}>
              <ArrowRight className="w-3 h-3" /> Seta
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => addElement("circle")}>
              <Circle className="w-3 h-3" /> Círculo
            </Button>
            {selectedId && (
              <Button size="sm" variant="destructive" className="text-xs gap-1" onClick={deleteSelected}>
                <Trash2 className="w-3 h-3" /> Remover
              </Button>
            )}
          </div>

          {/* AI Copy generator */}
          {imageIndex > 1 && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs gap-1"
              onClick={generateCopy}
              disabled={generatingCopy}
            >
              {generatingCopy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {generatingCopy ? "Gerando copy..." : "Gerar texto com IA"}
            </Button>
          )}

          {/* Selected element editor */}
          {selectedElement && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 border">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Editando: {selectedElement.type}
              </p>
              {(selectedElement.type === "headline" ||
                selectedElement.type === "subheadline" ||
                selectedElement.type === "bullet" ||
                selectedElement.type === "badge" ||
                selectedElement.type === "arrow") && (
                <Input
                  value={selectedElement.text || ""}
                  onChange={e => updateSelected({ text: e.target.value })}
                  placeholder="Texto..."
                  className="text-sm"
                />
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Tamanho</label>
                  <Input
                    type="number"
                    value={selectedElement.fontSize || 16}
                    onChange={e => updateSelected({ fontSize: parseInt(e.target.value) || 16 })}
                    className="text-sm"
                    min={8}
                    max={72}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Cor</label>
                  <Input
                    type="color"
                    value={selectedElement.color || headlineColor}
                    onChange={e => updateSelected({ color: e.target.value })}
                    className="h-9"
                  />
                </div>
                {selectedElement.type === "badge" && (
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Fundo</label>
                    <Input
                      type="color"
                      value={selectedElement.bgColor || accentColor}
                      onChange={e => updateSelected({ bgColor: e.target.value })}
                      className="h-9"
                    />
                  </div>
                )}
              </div>
              {(selectedElement.type === "arrow" || selectedElement.type === "circle") && (
                <div className="flex gap-2 items-center">
                  <RotateCw className="w-3 h-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={selectedElement.rotation || 0}
                    onChange={e => updateSelected({ rotation: parseInt(e.target.value) || 0 })}
                    className="text-sm w-20"
                    min={-180}
                    max={180}
                  />
                  <span className="text-xs text-muted-foreground">graus</span>
                </div>
              )}
            </div>
          )}

          {/* Export button */}
          <Button
            className="w-full h-11 gap-2 font-semibold"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Exportando..." : "Salvar imagem com overlay"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
