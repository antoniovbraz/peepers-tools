import { Button } from "@/components/ui/button";
import { Type, Plus, ArrowRight, Circle } from "lucide-react";
import type { ElementType } from "./types";

interface OverlayToolbarProps {
  onAdd: (type: ElementType) => void;
  isMobile: boolean;
}

export default function OverlayToolbar({ onAdd, isMobile }: OverlayToolbarProps) {
  return (
    <div className={`grid gap-1.5 ${isMobile ? "grid-cols-3" : "grid-cols-2"}`}>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => onAdd("headline")}>
        <Type className="w-3 h-3" /> Título
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => onAdd("bullet")}>
        <Plus className="w-3 h-3" /> Bullet
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => onAdd("badge")}>
        <Plus className="w-3 h-3" /> Badge
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => onAdd("arrow")}>
        <ArrowRight className="w-3 h-3" /> Seta
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => onAdd("circle")}>
        <Circle className="w-3 h-3" /> Círculo
      </Button>
      <Button size="sm" variant="outline" className="text-xs gap-1 h-10" onClick={() => onAdd("subheadline")}>
        <Type className="w-3 h-3" /> Sub
      </Button>
    </div>
  );
}
