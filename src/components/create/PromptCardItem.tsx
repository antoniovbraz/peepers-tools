import { useState, useRef, useEffect } from "react";
import { PromptCard } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Upload, ThumbsUp, RefreshCw, MessageSquare, Sparkles, Loader2, X, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ImageOverlayEditor from "./ImageOverlayEditor";

interface PromptCardItemProps {
  prompt: PromptCard;
  index: number;
  onUpdate: (id: number, updates: Partial<PromptCard>) => void;
  photoUrls: string[];
  headlineColor?: string;
  accentColor?: string;
  productName?: string;
  characteristics?: string[];
  overlayUrl?: string;
  onSaveOverlay?: (promptId: number, url: string) => void;
}

export default function PromptCardItem({
  prompt: p,
  index: i,
  onUpdate,
  photoUrls,
  headlineColor = "#1A2332",
  accentColor = "#D4A853",
  productName = "",
  characteristics = [],
  overlayUrl,
  onSaveOverlay,
}: PromptCardItemProps) {
  const handleError = useErrorHandler();
  const [copiedId, setCopiedId] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Revoke blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const copyPrompt = () => {
    navigator.clipboard.writeText(p.prompt);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const generateImage = async () => {
    setGenerating(true);
    try {
      // photoUrls are now public Storage URLs — pass directly
      const referencePhotos = photoUrls.slice(0, 3);

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: p.prompt, referencePhotos, feedback: p.feedback },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        onUpdate(p.id, { imageUrl: data.imageUrl });
      }
    } catch (err) {
      handleError(err, "Erro ao gerar imagem");
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    // Show blob preview immediately
    if (p.imageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(p.imageUrl);
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    onUpdate(p.id, { imageUrl: blobUrl });

    // Upload to Storage for persistence
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("generated-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("generated-images")
        .getPublicUrl(path);
      URL.revokeObjectURL(blobUrl);
      blobUrlRef.current = null;
      onUpdate(p.id, { imageUrl: urlData.publicUrl });
    } catch (err: any) {
      console.error("Upload to storage failed:", err);
      // Keep blob URL as fallback
    }
  };

  const submitFeedback = () => {
    onUpdate(p.id, {
      feedback: feedbackText,
      imageUrl: undefined,
      approved: false,
    });
    setFeedbackOpen(false);
    setFeedbackText("");
    toast({ title: "Feedback salvo, regenerando imagem..." });
    // Auto-regenerate after feedback
    setTimeout(() => generateImage(), 100);
  };

  return (
    <div
      className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-all ${
        p.approved ? "border-success/50" : ""
      }`}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">PROMPT #{i + 1}</span>
          {p.approved && (
            <Badge className="bg-success text-success-foreground text-xs gap-1">
              <Check className="w-3 h-3" /> Aprovada
            </Badge>
          )}
        </div>

        <p className="text-sm text-foreground leading-relaxed">{p.prompt}</p>

        <Button variant="outline" size="sm" className="gap-2 text-xs w-full" onClick={copyPrompt}>
          {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedId ? "Copiado!" : "Copiar prompt"}
        </Button>

        {p.imageUrl ? (
          <div className="space-y-2">
            <div className="relative">
              <img src={p.imageUrl} alt={`Imagem ${i + 1}`} className="w-full rounded-lg aspect-square object-cover" />
              {!p.approved && (
                <button
                  onClick={() => onUpdate(p.id, { imageUrl: undefined })}
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {!p.approved && (
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1 bg-success hover:bg-success/90" onClick={() => onUpdate(p.id, { approved: true })}>
                  <ThumbsUp className="w-3.5 h-3.5" /> Ficou boa
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setFeedbackOpen(!feedbackOpen)}>
                  <MessageSquare className="w-3.5 h-3.5" /> Refinar
                </Button>
              </div>
            )}
            {p.approved && i > 0 && (
              <div className="space-y-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1 text-xs"
                  onClick={() => setOverlayOpen(true)}
                >
                  <Layers className="w-3.5 h-3.5" /> Adicionar texto / efeitos
                </Button>
                {overlayUrl && (
                  <div className="flex items-center gap-2">
                    <img src={overlayUrl} alt="Overlay" className="w-10 h-10 rounded object-cover" />
                    <span className="text-xs text-success font-medium">Overlay salvo ✓</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1"
              onClick={generateImage}
              disabled={generating}
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generating ? "Gerando..." : "Gerar com IA"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => uploadRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" /> Upload
            </Button>
          </div>
        )}

        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleImageUpload(e.target.files)}
        />

        {feedbackOpen && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="O que ficou errado? Ex: fundo muito escuro, produto cortado..."
              rows={3}
            />
            <Button size="sm" className="w-full gap-1" onClick={submitFeedback}>
              <RefreshCw className="w-3.5 h-3.5" /> Salvar e regenerar
            </Button>
          </div>
        )}

        {/* Overlay Editor */}
        {p.imageUrl && p.approved && i > 0 && (
          <ImageOverlayEditor
            open={overlayOpen}
            onClose={() => setOverlayOpen(false)}
            imageUrl={p.imageUrl}
            imageIndex={i + 1}
            headlineColor={headlineColor}
            accentColor={accentColor}
            productName={productName}
            characteristics={characteristics}
            onSaveOverlay={(url) => onSaveOverlay?.(p.id, url)}
          />
        )}
      </div>
    </div>
  );
}
