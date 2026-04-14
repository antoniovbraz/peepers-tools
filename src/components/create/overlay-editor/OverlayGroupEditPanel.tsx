import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Trash2, Bold } from "lucide-react";
import type { OverlayElement } from "./types";
import ColorSwatch from "./ColorSwatch";

interface OverlayGroupEditPanelProps {
  checkedCount: number;
  headlineColor: string;
  accentColor: string;
  onUpdateChecked: (updates: Partial<OverlayElement>) => void;
  onDeleteChecked: () => void;
  onBatchFontSize: (v: number) => void;
  onBatchOpacity: (v: number) => void;
  pushStructuralSnapshot: () => void;
}

export default function OverlayGroupEditPanel({
  checkedCount,
  headlineColor,
  accentColor,
  onUpdateChecked,
  onDeleteChecked,
  onBatchFontSize,
  onBatchOpacity,
  pushStructuralSnapshot,
}: OverlayGroupEditPanelProps) {
  if (checkedCount < 2) return null;

  const colorPresets = [headlineColor, accentColor, "#000000", "#FFFFFF", "#6B7280"];

  return (
    <div className="bg-muted/50 rounded-lg p-3 border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          Edição em grupo ({checkedCount})
        </p>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive"
          onClick={onDeleteChecked}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Deletar todos
        </Button>
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Cor</label>
        <div className="flex items-center gap-2">
          {colorPresets.map((c, i) => (
            <ColorSwatch key={i} color={c} active={false}
              onClick={() => onUpdateChecked({ color: c } as Partial<OverlayElement>)} />
          ))}
          <Input type="color" value={headlineColor}
            onChange={(e) => onUpdateChecked({ color: e.target.value } as Partial<OverlayElement>)}
            className="h-8 w-8 p-0 border-0 cursor-pointer" />
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Tamanho</label>
        <Slider
          value={[16]}
          onValueChange={([v]) => onBatchFontSize(v)}
          onValueCommit={() => pushStructuralSnapshot()}
          min={8} max={72} step={1} className="w-full"
        />
      </div>

      {/* Bold */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1 text-xs"
          onClick={() => onUpdateChecked({ bold: true } as Partial<OverlayElement>)}>
          <Bold className="w-3.5 h-3.5" /> Bold On
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1 text-xs"
          onClick={() => onUpdateChecked({ bold: false } as Partial<OverlayElement>)}>
          Bold Off
        </Button>
      </div>

      {/* Opacity */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Opacidade</label>
        <Slider
          value={[100]}
          onValueChange={([v]) => onBatchOpacity(v)}
          onValueCommit={() => pushStructuralSnapshot()}
          min={0} max={100} step={5} className="w-full"
        />
      </div>
    </div>
  );
}
