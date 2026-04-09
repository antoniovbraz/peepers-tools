import { Button } from "@/components/ui/button";
import {
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween,
} from "lucide-react";

interface OverlayAlignmentBarProps {
  selectedId: string | null;
  checkedCount: number;
  onAlign: (axis: "x" | "y", align: "start" | "center" | "end") => void;
  onDistribute: (axis: "x" | "y") => void;
}

export default function OverlayAlignmentBar({
  selectedId,
  checkedCount,
  onAlign,
  onDistribute,
}: OverlayAlignmentBarProps) {
  const show = selectedId || checkedCount >= 2;
  if (!show) return null;

  return (
    <div className="bg-muted/50 rounded-lg p-2 border space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {checkedCount >= 2 ? `Alinhar grupo (${checkedCount})` : "Alinhar ao canvas"}
      </p>
      <div className="flex items-center gap-1 flex-wrap">
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Esquerda"
          onClick={() => onAlign("x", "start")}>
          <AlignHorizontalJustifyStart className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Centro H"
          onClick={() => onAlign("x", "center")}>
          <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Direita"
          onClick={() => onAlign("x", "end")}>
          <AlignHorizontalJustifyEnd className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Topo"
          onClick={() => onAlign("y", "start")}>
          <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Centro V"
          onClick={() => onAlign("y", "center")}>
          <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Embaixo"
          onClick={() => onAlign("y", "end")}>
          <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
        </Button>
        {checkedCount >= 3 && (
          <>
            <div className="w-px h-6 bg-border mx-0.5" />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Distribuir H"
              onClick={() => onDistribute("x")}>
              <AlignHorizontalSpaceBetween className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Distribuir V"
              onClick={() => onDistribute("y")}>
              <AlignVerticalSpaceBetween className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
