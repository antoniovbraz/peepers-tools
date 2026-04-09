import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface OverlayAICopyButtonProps {
  imageIndex: number;
  generatingCopy: boolean;
  checkedTextCount: number;
  checkedIds: Set<string>;
  onGenerate: (targetIds?: string[]) => void;
}

export default function OverlayAICopyButton({
  imageIndex,
  generatingCopy,
  checkedTextCount,
  checkedIds,
  onGenerate,
}: OverlayAICopyButtonProps) {
  if (imageIndex <= 1) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full text-xs gap-1.5 h-10"
      onClick={() => onGenerate(checkedTextCount > 0 ? [...checkedIds] : undefined)}
      disabled={generatingCopy}
    >
      {generatingCopy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      {generatingCopy
        ? "Gerando copy..."
        : checkedTextCount > 0
          ? `Gerar IA p/ selecionados (${checkedTextCount})`
          : "Gerar texto com IA (todos)"
      }
    </Button>
  );
}
