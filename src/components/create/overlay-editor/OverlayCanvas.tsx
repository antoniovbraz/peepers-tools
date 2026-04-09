import { useEffect, useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Move } from "lucide-react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import { renderOverlay } from "./helpers/renderEngine";
import type { OverlayElement, RenderOptions } from "./types";
import type { UseCanvasInteractionReturn } from "@/hooks/useCanvasInteraction";
import { useIsMobile } from "@/hooks/use-mobile";

interface OverlayCanvasProps {
  interaction: UseCanvasInteractionReturn;
  elements: OverlayElement[];
  selectedId: string | null;
  loadedImage: HTMLImageElement | null;
  headlineColor: string;
  accentColor: string;
}

export default function OverlayCanvas({
  interaction,
  elements,
  selectedId,
  loadedImage,
  headlineColor,
  accentColor,
}: OverlayCanvasProps) {
  const isMobile = useIsMobile();
  const [fontsReady, setFontsReady] = useState(false);
  const [canvasSize, setCanvasSize] = useState(400);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const update = () => {
      if (isMobile) {
        const vw = window.innerWidth - 24;
        const vh = window.innerHeight * 0.35;
        setCanvasSize(Math.floor(Math.min(vw, vh)));
      } else {
        setCanvasSize(0);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isMobile]);

  const renderCanvas = useCallback(() => {
    const canvas = interaction.canvasRef.current;
    if (!canvas || !loadedImage || !fontsReady) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const options: RenderOptions = {
      selectedId,
      hoveredId: interaction.hoveredId,
      guides: interaction.activeGuides,
      showSelectionHandles: true,
      previewMode: false,
    };

    renderOverlay(ctx, loadedImage, elements, CANVAS_WIDTH, CANVAS_HEIGHT, { headlineColor, accentColor }, options);
  }, [elements, loadedImage, selectedId, interaction.hoveredId, headlineColor, accentColor, fontsReady, interaction.activeGuides, interaction.canvasRef]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div
      ref={interaction.containerRef}
      className={`relative border rounded-lg overflow-hidden bg-muted aspect-square${!isMobile ? " max-h-full max-w-full" : ""}`}
      style={isMobile && canvasSize > 0 ? { width: canvasSize, height: canvasSize, margin: "0 auto" } : undefined}
    >
      <canvas
        ref={interaction.canvasRef}
        className="w-full h-full cursor-move"
        style={{ touchAction: "pan-y" }}
        onMouseDown={interaction.handleMouseDown}
        onMouseMove={interaction.handleMouseMove}
        onMouseUp={interaction.handleMouseUp}
        onMouseLeave={interaction.handleMouseLeave}
        onTouchStart={interaction.handleTouchStart}
        onTouchMove={interaction.handleTouchMove}
        onTouchEnd={interaction.handleTouchEnd}
      />
      <div
        className={`absolute top-2 left-2 transition-opacity duration-500 ${interaction.showDragBadge ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <Badge variant="secondary" className="text-xs">
          <Move className="w-3 h-3 mr-1" /> Arraste para mover
        </Badge>
      </div>
    </div>
  );
}
