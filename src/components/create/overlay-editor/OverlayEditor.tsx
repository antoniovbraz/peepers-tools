import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Type, X, ChevronsDown, ListChecks } from "lucide-react";
import { IMAGE_ROLES } from "@/lib/overlayTemplates";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreateListing } from "@/context/CreateListingContext";
import { useOverlayEditor } from "@/hooks/useOverlayEditor";
import { useCanvasInteraction } from "@/hooks/useCanvasInteraction";
import { useOverlayAI } from "@/hooks/useOverlayAI";
import type { OverlayEditorProps, OverlayElement } from "./types";
import { hasText } from "./types";
import OverlayCanvas from "./OverlayCanvas";
import OverlayToolbar from "./OverlayToolbar";
import OverlayLayerList from "./OverlayLayerList";
import OverlayPropertyPanel from "./OverlayPropertyPanel";
import OverlayAlignmentBar from "./OverlayAlignmentBar";
import OverlayGroupEditPanel from "./OverlayGroupEditPanel";
import OverlayAICopyButton from "./OverlayAICopyButton";
import OverlayExportButton from "./OverlayExportButton";

export default function OverlayEditor({
  open, onClose, imageUrl, imageIndex,
  headlineColor, accentColor, productName, characteristics, onSaveOverlay,
}: OverlayEditorProps) {
  const isMobile = useIsMobile();
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const { getAllOverlayCopies } = useCreateListing();
  const role = IMAGE_ROLES[imageIndex - 1];

  const editor = useOverlayEditor();

  const interaction = useCanvasInteraction({
    editor,
    isMobile: !!isMobile,
    onSheetOpen: () => setSheetOpen(true),
    textInputRef,
    open,
  });

  const ai = useOverlayAI({
    productName,
    characteristics,
    imageIndex,
    imageRole: role?.role || "benefits",
    elements: editor.elements,
    setElements: editor.setElements,
    pushStructuralSnapshot: editor.pushStructuralSnapshot,
    getAllOverlayCopies,
    headlineColor,
  });

  // Load base image
  useEffect(() => {
    if (!imageUrl || !open) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedImage(img);
    img.onerror = () => console.error("Failed to load image for overlay");
    img.src = imageUrl;
  }, [imageUrl, open]);

  // Load elements on open
  useEffect(() => {
    if (!open) return;
    editor.loadElements(imageIndex, headlineColor, accentColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageIndex]);

  // Reset sheet when closing
  useEffect(() => {
    if (!open) {
      setSheetOpen(false);
      setLayersOpen(false);
    }
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault(); editor.undo(); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault(); editor.redo(); return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && editor.selectedId) {
        e.preventDefault();
        editor.deleteElement(editor.selectedId);
        return;
      }
      if (e.key === "Escape") {
        editor.setSelectedId(null);
        setSheetOpen(false);
        return;
      }
      if (editor.selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowLeft" ? -delta : e.key === "ArrowRight" ? delta : 0;
        const dy = e.key === "ArrowUp" ? -delta : e.key === "ArrowDown" ? delta : 0;
        editor.setElements((prev) =>
          prev.map((el) =>
            el.id === editor.selectedId
              ? { ...el, x: Math.max(0, Math.min(100, el.x + dx)), y: Math.max(0, Math.min(100, el.y + dy)) }
              : el,
          ),
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, editor]);

  // Derived counts
  const checkedTextElements = editor.elements.filter(
    (el) => editor.checkedIds.has(el.id) && hasText(el),
  );
  const checkedTextCount = checkedTextElements.length;

  // Callbacks for alignment (need getElSize from interaction)
  const handleAlign = useCallback(
    (axis: "x" | "y", align: "start" | "center" | "end") => {
      editor.alignElements(axis, align, interaction.getElSize);
    },
    [editor, interaction],
  );

  const handleDistribute = useCallback(
    (axis: "x" | "y") => {
      editor.distributeElements(axis, interaction.getElSize);
    },
    [editor, interaction],
  );

  // Batch operations for group edit
  const handleBatchFontSize = useCallback(
    (v: number) => {
      editor.setElements((prev) =>
        prev.map((el) =>
          editor.checkedIds.has(el.id) ? { ...el, fontSize: v } as OverlayElement : el,
        ),
      );
    },
    [editor],
  );

  const handleBatchOpacity = useCallback(
    (v: number) => {
      editor.setElements((prev) =>
        prev.map((el) =>
          editor.checkedIds.has(el.id) ? { ...el, opacity: v } : el,
        ),
      );
    },
    [editor],
  );

  const handleLayerSelect = useCallback(
    (id: string) => {
      editor.setSelectedId(id);
      if (isMobile) setSheetOpen(true);
    },
    [editor, isMobile],
  );

  const handleAddElement = useCallback(
    (type: OverlayElement["type"]) => {
      editor.addElement(type, headlineColor, accentColor);
      if (isMobile) setSheetOpen(true);
    },
    [editor, headlineColor, accentColor, isMobile],
  );

  // ── MOBILE layout ──
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

        <div className="shrink-0 px-3 pt-3">
          <OverlayCanvas
            interaction={interaction}
            elements={editor.elements}
            selectedId={editor.selectedId}
            loadedImage={loadedImage}
            headlineColor={headlineColor}
            accentColor={accentColor}
          />
        </div>

        <div className="shrink-0 px-3 py-2">
          <OverlayToolbar onAdd={handleAddElement} isMobile />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3">
          <Collapsible open={layersOpen} onOpenChange={setLayersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-10">
                <span className="flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" />
                  Elementos
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{editor.elements.length}</Badge>
                </span>
                <ChevronsDown className={`w-3.5 h-3.5 transition-transform ${layersOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <OverlayLayerList
                elements={editor.elements}
                selectedId={editor.selectedId}
                checkedIds={editor.checkedIds}
                generatingCopy={ai.generatingCopy}
                generatingElementId={ai.generatingElementId}
                canUndo={editor.canUndo}
                canRedo={editor.canRedo}
                isMobile
                onSelect={handleLayerSelect}
                onToggleCheck={editor.toggleCheck}
                onMoveLayer={editor.moveLayer}
                onDuplicate={editor.duplicateElement}
                onDelete={editor.deleteElement}
                onGenerateSingle={ai.generateSingleCopy}
                onUndo={editor.undo}
                onRedo={editor.redo}
              />
            </CollapsibleContent>
          </Collapsible>

          <OverlayAlignmentBar
            selectedId={editor.selectedId}
            checkedCount={editor.checkedIds.size}
            onAlign={handleAlign}
            onDistribute={handleDistribute}
          />

          <OverlayGroupEditPanel
            checkedCount={editor.checkedIds.size}
            headlineColor={headlineColor}
            accentColor={accentColor}
            onUpdateChecked={editor.updateCheckedElements}
            onDeleteChecked={editor.deleteCheckedElements}
            onBatchFontSize={handleBatchFontSize}
            onBatchOpacity={handleBatchOpacity}
            pushStructuralSnapshot={editor.pushStructuralSnapshot}
          />

          <OverlayAICopyButton
            imageIndex={imageIndex}
            generatingCopy={ai.generatingCopy}
            checkedTextCount={checkedTextCount}
            checkedIds={editor.checkedIds}
            onGenerate={ai.generateCopy}
          />
        </div>

        <div className="shrink-0 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t bg-background">
          <OverlayExportButton
            elements={editor.elements}
            loadedImage={loadedImage}
            headlineColor={headlineColor}
            accentColor={accentColor}
            onSaveOverlay={onSaveOverlay}
            onClose={onClose}
          />
        </div>

        <Sheet open={sheetOpen && !!editor.selectedElement} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-sm">Propriedades</SheetTitle>
            </SheetHeader>
            <div className="pt-2">
              {editor.selectedElement && (
                <OverlayPropertyPanel
                  element={editor.selectedElement}
                  headlineColor={headlineColor}
                  accentColor={accentColor}
                  generatingCopy={ai.generatingCopy}
                  generatingElementId={ai.generatingElementId}
                  isMobile
                  textInputRef={textInputRef}
                  onUpdate={editor.updateElement}
                  onUpdateText={editor.updateElementText}
                  onDuplicate={editor.duplicateElement}
                  onMoveLayer={editor.moveLayer}
                  onGenerateSingle={ai.generateSingleCopy}
                  pushStructuralSnapshot={editor.pushStructuralSnapshot}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // ── DESKTOP layout ──
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Type className="w-4 h-4" />
            Editor de Overlay — {role?.label || `Imagem #${imageIndex}`}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[1fr_340px] gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="min-h-0 overflow-hidden flex items-center justify-center">
            <OverlayCanvas
              interaction={interaction}
              elements={editor.elements}
              selectedId={editor.selectedId}
              loadedImage={loadedImage}
              headlineColor={headlineColor}
              accentColor={accentColor}
            />
          </div>
          <div className="min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                <OverlayToolbar onAdd={handleAddElement} isMobile={false} />

                <OverlayLayerList
                  elements={editor.elements}
                  selectedId={editor.selectedId}
                  checkedIds={editor.checkedIds}
                  generatingCopy={ai.generatingCopy}
                  generatingElementId={ai.generatingElementId}
                  canUndo={editor.canUndo}
                  canRedo={editor.canRedo}
                  isMobile={false}
                  onSelect={handleLayerSelect}
                  onToggleCheck={editor.toggleCheck}
                  onMoveLayer={editor.moveLayer}
                  onDuplicate={editor.duplicateElement}
                  onDelete={editor.deleteElement}
                  onGenerateSingle={ai.generateSingleCopy}
                  onUndo={editor.undo}
                  onRedo={editor.redo}
                />

                <OverlayAlignmentBar
                  selectedId={editor.selectedId}
                  checkedCount={editor.checkedIds.size}
                  onAlign={handleAlign}
                  onDistribute={handleDistribute}
                />

                <OverlayGroupEditPanel
                  checkedCount={editor.checkedIds.size}
                  headlineColor={headlineColor}
                  accentColor={accentColor}
                  onUpdateChecked={editor.updateCheckedElements}
                  onDeleteChecked={editor.deleteCheckedElements}
                  onBatchFontSize={handleBatchFontSize}
                  onBatchOpacity={handleBatchOpacity}
                  pushStructuralSnapshot={editor.pushStructuralSnapshot}
                />

                <OverlayAICopyButton
                  imageIndex={imageIndex}
                  generatingCopy={ai.generatingCopy}
                  checkedTextCount={checkedTextCount}
                  checkedIds={editor.checkedIds}
                  onGenerate={ai.generateCopy}
                />

                {editor.selectedElement && (
                  <OverlayPropertyPanel
                    element={editor.selectedElement}
                    headlineColor={headlineColor}
                    accentColor={accentColor}
                    generatingCopy={ai.generatingCopy}
                    generatingElementId={ai.generatingElementId}
                    isMobile={false}
                    textInputRef={textInputRef}
                    onUpdate={editor.updateElement}
                    onUpdateText={editor.updateElementText}
                    onDuplicate={editor.duplicateElement}
                    onMoveLayer={editor.moveLayer}
                    onGenerateSingle={ai.generateSingleCopy}
                    pushStructuralSnapshot={editor.pushStructuralSnapshot}
                  />
                )}

                <OverlayExportButton
                  elements={editor.elements}
                  loadedImage={loadedImage}
                  headlineColor={headlineColor}
                  accentColor={accentColor}
                  onSaveOverlay={onSaveOverlay}
                  onClose={onClose}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
