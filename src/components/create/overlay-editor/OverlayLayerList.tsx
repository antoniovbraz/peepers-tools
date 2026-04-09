import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Type, Trash2, Loader2, Sparkles, ListChecks,
  ChevronUp, ChevronDown, Undo2, Redo2, Copy, ArrowRight, Circle, Tag,
} from "lucide-react";
import type { OverlayElement } from "./types";
import { hasText } from "./types";

interface OverlayLayerListProps {
  elements: OverlayElement[];
  selectedId: string | null;
  checkedIds: Set<string>;
  generatingCopy: boolean;
  generatingElementId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  isMobile: boolean;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateSingle: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

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

export default function OverlayLayerList({
  elements,
  selectedId,
  checkedIds,
  generatingCopy,
  generatingElementId,
  canUndo,
  canRedo,
  isMobile,
  onSelect,
  onToggleCheck,
  onMoveLayer,
  onDuplicate,
  onDelete,
  onGenerateSingle,
  onUndo,
  onRedo,
}: OverlayLayerListProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5" /> Elementos ({elements.length})
        </p>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={!canUndo} onClick={onUndo} title="Desfazer (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={!canRedo} onClick={onRedo} title="Refazer (Ctrl+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="max-h-[220px]">
        <div className="space-y-1">
          {elements.map((el, idx) => {
            const isSelected = el.id === selectedId;
            const isChecked = checkedIds.has(el.id);
            const hasTextContent = hasText(el);
            const isGenerating = generatingElementId === el.id;

            return (
              <div
                key={el.id}
                className={`flex items-center gap-2 px-2 py-2.5 rounded-md cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/80"
                }`}
                onClick={() => onSelect(el.id)}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggleCheck(el.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                />

                <LayerIcon type={el.type} />

                <span className="text-xs truncate flex-1 text-foreground">
                  {hasTextContent ? `"${el.text}"` : el.type}
                </span>

                {!isMobile && (
                  <>
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={idx >= elements.length - 1}
                      onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, "up"); }}
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={idx <= 0}
                      onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, "down"); }}
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                    {hasTextContent && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-9 w-9 shrink-0"
                        disabled={isGenerating || generatingCopy}
                        onClick={(e) => { e.stopPropagation(); onGenerateSingle(el.id); }}
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
                      onClick={(e) => { e.stopPropagation(); onDuplicate(el.id); }}
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}

                <Button
                  type="button" variant="ghost" size="icon"
                  className="h-9 w-9 shrink-0 text-destructive/60 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
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
}
