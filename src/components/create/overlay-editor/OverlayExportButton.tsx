import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { OverlayElement } from "./types";
import { exportOverlayAsBlob } from "./helpers/exportCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OverlayExportButtonProps {
  elements: OverlayElement[];
  loadedImage: HTMLImageElement | null;
  headlineColor: string;
  accentColor: string;
  onSaveOverlay: (overlayUrl: string) => void;
  onClose: () => void;
}

export default function OverlayExportButton({
  elements,
  loadedImage,
  headlineColor,
  accentColor,
  onSaveOverlay,
  onClose,
}: OverlayExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!loadedImage) return;
    setExporting(true);
    try {
      const blob = await exportOverlayAsBlob(
        loadedImage,
        elements,
        { headlineColor, accentColor },
      );

      const path = `overlays/${crypto.randomUUID()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(path, blob, { contentType: "image/png", upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(path);
      onSaveOverlay(urlData.publicUrl);
      toast({ title: "Imagem com overlay salva!" });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Export overlay error:", err);
      toast({ title: "Erro ao exportar", description: msg, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [loadedImage, elements, headlineColor, accentColor, onSaveOverlay, onClose]);

  return (
    <Button className="w-full h-12 gap-2 font-semibold" onClick={handleExport} disabled={exporting}>
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? "Exportando..." : "Salvar imagem com overlay"}
    </Button>
  );
}
