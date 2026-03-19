import { useState, useEffect, useRef, useCallback } from "react";
import { useCreateListing, PromptCard } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, RefreshCw, ClipboardList, Loader2, ThumbsUp, Sparkles, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PromptCardItem from "./PromptCardItem";

export default function StepPrompts() {
  const { data, updatePrompts, updateVisualDNA, updateOverlayUrl, completeStep, goNext, goBack } = useCreateListing();
  const [prompts, setPrompts] = useState<PromptCard[]>(data.prompts);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(prompts.some(p => p.prompt && p.prompt.length > 20));

  // Batch generation state
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const cancelRef = useRef(false);

  const approvedCount = prompts.filter(p => p.approved).length;

  const generatePrompts = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-prompts", {
        body: {
          productName: data.identification.name,
          category: data.identification.category,
          characteristics: data.identification.characteristics,
          extras: data.identification.extras,
          adTitle: data.ads.mercadoLivre.title,
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // Save visualDNA if returned
      if (result?.visualDNA) {
        updateVisualDNA(result.visualDNA);
      }

      const promptsList = result?.prompts || [];
      const newPrompts = promptsList.slice(0, 7).map((text: string, i: number) => ({
        id: i + 1,
        prompt: text,
        approved: false,
        imageUrl: undefined,
        feedback: undefined,
      }));
      setPrompts(newPrompts);
      updatePrompts(newPrompts);
      setGenerated(true);
    } catch (err: any) {
      console.error("Generate prompts error:", err);
      toast({ title: "Erro ao gerar prompts", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!generated && data.identification.name) {
      generatePrompts();
    }
  }, []);

  const copyAll = () => {
    const allText = prompts.map((p, i) => `#${i + 1}\n${p.prompt}`).join("\n\n");
    navigator.clipboard.writeText(allText);
    toast({ title: "Todos os prompts copiados!" });
  };

  const updatePrompt = (id: number, updates: Partial<PromptCard>) => {
    setPrompts(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      updatePrompts(next);
      return next;
    });
  };

  const generateAllImages = useCallback(async () => {
    cancelRef.current = false;
    setBatchGenerating(true);
    setBatchProgress(0);

    const pending = prompts.filter(p => !p.imageUrl && !p.approved);
    const referencePhotos = data.photoUrls.slice(0, 3);

    for (let idx = 0; idx < pending.length; idx++) {
      if (cancelRef.current) break;
      const p = pending[idx];
      setBatchProgress(idx + 1);

      try {
        const { data: result, error } = await supabase.functions.invoke("generate-image", {
          body: { prompt: p.prompt, referencePhotos, feedback: p.feedback },
        });
        if (error) throw error;
        if (result?.error) throw new Error(result.error);
        if (result?.imageUrl) {
          updatePrompt(p.id, { imageUrl: result.imageUrl });
        }
      } catch (err: any) {
        console.error(`Generate image #${p.id} error:`, err);
        toast({ title: `Erro na imagem #${p.id}`, description: err.message, variant: "destructive" });
      }
    }

    setBatchGenerating(false);
    if (!cancelRef.current) {
      toast({ title: "Todas as imagens foram geradas!" });
    }
  }, [prompts, data.photoUrls]);

  const cancelBatch = () => {
    cancelRef.current = true;
    setBatchGenerating(false);
    toast({ title: "Geração cancelada" });
  };

  const handleNext = () => {
    completeStep(3);
    goNext();
  };

  if (loading) {
    return (
      <div className="px-4 py-10 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <h2 className="font-display text-lg font-bold">Gerando prompts...</h2>
        <p className="text-sm text-muted-foreground text-center">A IA está criando 7 prompts de imagem para seu produto</p>
      </div>
    );
  }

  const pendingCount = prompts.filter(p => !p.imageUrl && !p.approved).length;

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-display text-xl font-bold text-foreground">Prompts de Imagem</h2>
        <p className="text-sm text-muted-foreground">Gere imagens com IA ou faça upload manual</p>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs gap-1">
          <ThumbsUp className="w-3 h-3" /> {approvedCount}/7 aprovadas
        </Badge>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={generatePrompts}>
            <RefreshCw className="w-3.5 h-3.5" /> Regenerar
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={copyAll}>
            <ClipboardList className="w-3.5 h-3.5" /> Copiar todos
          </Button>
        </div>
      </div>

      {/* Generate All button */}
      {pendingCount > 0 && (
        <div>
          {batchGenerating ? (
            <div className="flex gap-2">
              <Button disabled className="flex-1 gap-2 h-10">
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando {batchProgress}/{pendingCount}...
              </Button>
              <Button variant="destructive" size="sm" className="h-10 gap-1" onClick={cancelBatch}>
                <XCircle className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          ) : (
            <Button className="w-full gap-2 h-10" variant="outline" onClick={generateAllImages}>
              <Sparkles className="w-4 h-4" /> Gerar todas as {pendingCount} imagens
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {prompts.map((p, i) => (
          <PromptCardItem
            key={p.id}
            prompt={p}
            index={i}
            onUpdate={updatePrompt}
            photoUrls={data.photoUrls}
            headlineColor={data.visualDNA?.headlineColor}
            accentColor={data.visualDNA?.accentColor}
            productName={data.identification.name}
            characteristics={data.identification.characteristics}
            overlayUrl={data.overlayUrls[p.id]}
            onSaveOverlay={(promptId, url) => updateOverlayUrl(promptId, url)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleNext}
          disabled={approvedCount < 7}
          className="flex-1 h-12 text-base font-semibold gap-2"
        >
          {approvedCount < 7 ? `${approvedCount}/7 aprovadas` : "Próximo"} <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
