import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Bold, AlignLeft, AlignCenter, AlignRight, RotateCw,
  Copy, Sparkles, Loader2, ChevronUp, ChevronDown,
} from "lucide-react";
import type { OverlayElement } from "./types";
import { isTextElement, hasText, hasBgColor, hasRotation } from "./types";

interface OverlayPropertyPanelProps {
  element: OverlayElement;
  headlineColor: string;
  accentColor: string;
  generatingCopy: boolean;
  generatingElementId: string | null;
  isMobile: boolean;
  textInputRef: React.RefObject<HTMLInputElement | null>;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
  onUpdateText: (id: string, text: string) => void;
  onDuplicate: (id: string) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  onGenerateSingle: (id: string) => void;
  pushStructuralSnapshot: () => void;
}

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

export default function OverlayPropertyPanel({
  element,
  headlineColor,
  accentColor,
  generatingCopy,
  generatingElementId,
  isMobile,
  textInputRef,
  onUpdate,
  onUpdateText,
  onDuplicate,
  onMoveLayer,
  onGenerateSingle,
  pushStructuralSnapshot,
}: OverlayPropertyPanelProps) {
  const el = element;
  const colorPresets = [headlineColor, accentColor, "#000000", "#FFFFFF", "#6B7280"];

  const elHasText = hasText(el);
  const isText = isTextElement(el);
  const elHasBgColor = hasBgColor(el);
  const elHasRotation = hasRotation(el);

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-3 border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          {el.type}
        </p>
        {isMobile && (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => onDuplicate(el.id)} title="Duplicar">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            {elHasText && (
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
                disabled={generatingElementId === el.id || generatingCopy}
                onClick={() => onGenerateSingle(el.id)} title="IA">
                {generatingElementId === el.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Sparkles className="w-3.5 h-3.5" />}
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => onMoveLayer(el.id, "up")} title="↑ z-index">
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => onMoveLayer(el.id, "down")} title="↓ z-index">
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {elHasText && (
        <Input
          ref={textInputRef}
          value={el.text}
          onChange={(e) => onUpdateText(el.id, e.target.value)}
          onFocus={(e) => {
            if (isMobile) {
              setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
            }
          }}
          placeholder="Texto..."
          className="text-sm"
        />
      )}

      {isText && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={el.bold ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1 text-xs"
            onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { bold: !el.bold }); }}
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button type="button" size="sm" className="h-9 w-9 p-0"
            variant={(!el.textAlign || el.textAlign === "left") ? "default" : "outline"}
            onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { textAlign: "left" }); }}>
            <AlignLeft className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" size="sm" className="h-9 w-9 p-0"
            variant={el.textAlign === "center" ? "default" : "outline"}
            onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { textAlign: "center" }); }}>
            <AlignCenter className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" size="sm" className="h-9 w-9 p-0"
            variant={el.textAlign === "right" ? "default" : "outline"}
            onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { textAlign: "right" }); }}>
            <AlignRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {isText && (
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" className="h-9 text-xs px-2"
            variant={(!el.textStyle || el.textStyle === "none") ? "outline" : "ghost"}
            onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { textStyle: "none" }); }}>
            Normal
          </Button>
          <Button type="button" size="sm" className="h-9 text-xs px-2"
            variant={el.textStyle === "shadow" ? "default" : "outline"}
            onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { textStyle: "shadow" }); }}>
            Sombra
          </Button>
          <Button type="button" size="sm" className="h-9 text-xs px-2"
            variant={el.textStyle === "stroke" ? "default" : "outline"}
            onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { textStyle: "stroke" }); }}>
            Contorno
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Tamanho: {"fontSize" in el ? el.fontSize : 16}</span>
        <Slider
          value={["fontSize" in el ? el.fontSize : 16]}
          onValueChange={([v]) => onUpdate(el.id, { fontSize: v } as Partial<OverlayElement>)}
          onValueCommit={() => pushStructuralSnapshot()}
          min={8} max={72} step={1} className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">X (%)</span>
          <Slider
            value={[Math.round(el.x)]}
            onValueChange={([v]) => onUpdate(el.id, { x: v })}
            onValueCommit={() => pushStructuralSnapshot()}
            min={0} max={100} step={1} className="w-full"
          />
          <span className="text-[10px] text-muted-foreground text-center block">{Math.round(el.x)}</span>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Y (%)</span>
          <Slider
            value={[Math.round(el.y)]}
            onValueChange={([v]) => onUpdate(el.id, { y: v })}
            onValueCommit={() => pushStructuralSnapshot()}
            min={0} max={100} step={1} className="w-full"
          />
          <span className="text-[10px] text-muted-foreground text-center block">{Math.round(el.y)}</span>
        </div>
      </div>

      {isText && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Largura: {el.width}%</span>
          <Slider
            value={[el.width]}
            onValueChange={([v]) => onUpdate(el.id, { width: v } as Partial<OverlayElement>)}
            min={20} max={90} step={5} className="w-full"
          />
        </div>
      )}

      {el.type === "circle" && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Raio: {el.radius}%</span>
          <Slider
            value={[el.radius]}
            onValueChange={([v]) => onUpdate(el.id, { radius: v } as Partial<OverlayElement>)}
            min={2} max={50} step={1} className="w-full"
          />
        </div>
      )}

      {el.type === "arrow" && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Comprimento: {el.length}%</span>
          <Slider
            value={[el.length]}
            onValueChange={([v]) => onUpdate(el.id, { length: v } as Partial<OverlayElement>)}
            min={2} max={50} step={1} className="w-full"
          />
        </div>
      )}

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Opacidade: {el.opacity}%</span>
        <Slider
          value={[el.opacity]}
          onValueChange={([v]) => onUpdate(el.id, { opacity: v })}
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
              active={("color" in el ? el.color : headlineColor) === c}
              onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { color: c } as Partial<OverlayElement>); }}
            />
          ))}
          <Input
            type="color"
            value={"color" in el ? el.color : headlineColor}
            onChange={(e) => onUpdate(el.id, { color: e.target.value } as Partial<OverlayElement>)}
            className="h-8 w-8 p-0 border-0 cursor-pointer"
          />
        </div>
      </div>

      {elHasBgColor && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Cor do fundo</label>
          <div className="flex items-center gap-2">
            {colorPresets.map((c, i) => (
              <ColorSwatch
                key={i}
                color={c}
                active={el.bgColor === c}
                onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { bgColor: c } as Partial<OverlayElement>); }}
              />
            ))}
            <Input
              type="color"
              value={el.bgColor}
              onChange={(e) => onUpdate(el.id, { bgColor: e.target.value } as Partial<OverlayElement>)}
              className="h-8 w-8 p-0 border-0 cursor-pointer"
            />
          </div>
        </div>
      )}

      {elHasRotation && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Rotação</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-11 px-3 text-xs"
              onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { rotation: Math.max(-180, (el.rotation || 0) - 15) } as Partial<OverlayElement>); }}>
              −15°
            </Button>
            <span className="min-w-[4ch] text-center font-mono text-sm tabular-nums">
              {el.type === "arrow" ? el.rotation : 0}°
            </span>
            <Button type="button" variant="outline" size="sm" className="h-11 px-3 text-xs"
              onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { rotation: Math.min(180, (el.rotation || 0) + 15) } as Partial<OverlayElement>); }}>
              +15°
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11"
              onClick={() => { pushStructuralSnapshot(); onUpdate(el.id, { rotation: 0 } as Partial<OverlayElement>); }} title="Resetar rotação">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
