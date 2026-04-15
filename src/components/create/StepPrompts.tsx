import { useState, useEffect, useRef, useCallback } from "react";
import { useCreateListing, PromptCard } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, RefreshCw, ClipboardList, Loader2, ThumbsUp, Sparkles, XCircle, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { invokeWithRetry } from "@/lib/retryFetch";
import PromptCardItem from "./PromptCardItem";

const MAX_PROMPTS = 7;
const INITIAL_PROMPTS = 3;

export default function StepPrompts() {
  const { data, updatePrompts, updateVisualDNA, updateOverlayUrl, completeStep, goNext, goBack } = useCreateListing();
  const handleError = useErrorHandler();
  const [prompts, setPrompts] = useState<PromptCard[]>(data.prompts);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(prompts.some(p => p.prompt && p.prompt.length > 20));

  // All 7 prompts from AI stored here; we slice to show only `visibleCount`
  const allPromptsRef = useRef<PromptCard[]>([]);
  const [visibleCount, setVisibleCount] = useState(() => {
    // If restoring from draft, show however many were saved
    const saved = data.prompts.filter(p => p.prompt && p.prompt.length > 20).length;
    return saved > INITIAL_PROMPTS ? saved : INITIAL_PROMPTS;
  });

  // Batch generation state
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const cancelRef = useRef(false);

  const approvedCount = prompts.filter(p => p.approved).length;
  const totalVisible = prompts.length;

  const generatePrompts = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await invokeWithRetry("generate-prompts", {
        productName: data.identification.name,
        category: data.identification.category,
        suggested_category: data.identification.suggested_category,
        characteristics: data.identification.characteristics,
        extras: data.identification.extras,
        adTitle: data.ads.mercadoLivre.title,
        marketplace: data.marketplace,
        referencePhotos: data.photoUrls,
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      if (result?.visualDNA) {
        updateVisualDNA(result.visualDNA);
      }

      const promptsList = result?.prompts || [];
      const all7 = promptsList.slice(0, MAX_PROMPTS).map((item: string | { prompt: string; summary_ptbr?: string }, i: number) => ({
        id: i + 1,
        prompt: typeof item === "string" ? item : item.prompt,
        summary_ptbr: typeof item === "string" ? undefined : item.summary_ptbr,
        approved: false,
        imageUrl: undefined,
        feedback: undefined,
      }));
      allPromptsRef.current = all7;

      // Show only first `visibleCount`
      const visible = all7.slice(0, visibleCount);
      setPrompts(visible);
      updatePrompts(visible);
      setGenerated(true);
    } catch (err) {
      handleError(err, "Erro ao gerar prompts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!generated && data.identification.name) {
      generatePrompts();
    }
  }, []);

  const addMorePrompts = () => {
    const newCount = Math.min(visibleCount + 1, MAX_PROMPTS);
    setVisibleCount(newCount);

    // If we have pre-generated prompts from the AI, add the next one
    if (allPromptsRef.current.length >= newCount) {
      const visible = allPromptsRef.current.slice(0, newCount);
      setPrompts(visible);
      updatePrompts(visible);
    } else {
      // Fallback: add empty prompt card
      const newPrompt: PromptCard = {
        id: newCount,
        prompt: "",
        approved: false,
      };
      const next = [...prompts, newPrompt];
      setPrompts(next);
      updatePrompts(next);
    }
  };

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
    const referencePhotos = data.photoUrls;

    for (let idx = 0; idx < pending.length; idx++) {
      if (cancelRef.current) break;
      const p = pending[idx];
      setBatchProgress(idx + 1);

      try {
        const { data: result, error } = await invokeWithRetry("generate-image", {
          prompt: p.prompt, referencePhotos, feedback: p.feedback,
        });
        if (error) throw error;
        if (result?.error) throw new Error(result.error);
        if (result?.imageUrl) {
          // Persist immediately — survives page refresh
          updatePrompt(p.id, { imageUrl: result.imageUrl });
        }
      } catch (err) {
        handleError(err, `Erro na imagem #${p.id}`);
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
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-lg font-bold">Gerando prompts...</h2>
        <p className="text-sm text-muted-foreground text-center">Criando {MAX_PROMPTS} prompts de imagem com Visual DNA para seu produto</p>
        <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: "40%" }} />
        </div>
        <p className="text-xs text-muted-foreground">Estimativa: ~40 segundos</p>

        {/* Skeleton preview of prompt cards */}
        <div className="w-full max-w-lg space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted/60 rounded animate-pulse" />
              </div>
              <div className="h-9 w-full bg-muted/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 italic mt-2">💡 Dica: a IA analisa seu produto para criar composições visuais únicas</p>
      </div>
    );
  }

  const pendingCount = prompts.filter(p => !p.imageUrl && !p.approved).length;
  const canAddMore = visibleCount < MAX_PROMPTS;

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Prompts de Imagem</h2>
        <p className="text-sm text-muted-foreground">Gere imagens com IA ou faça upload manual</p>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs gap-1">
          <ThumbsUp className="w-3 h-3" /> {approvedCount}/{totalVisible} aprovadas
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

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
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

      {/* Add more prompts */}
      {canAddMore && (
        <Button
          variant="ghost"
          className="w-full h-12 border border-dashed border-border gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50"
          onClick={addMorePrompts}
        >
          <Plus className="w-4 h-4" /> Adicionar mais imagem ({visibleCount}/{MAX_PROMPTS})
        </Button>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleNext}
          disabled={approvedCount < totalVisible}
          className="flex-1 h-12 text-base font-semibold gap-2"
        >
          {approvedCount < totalVisible ? `${approvedCount}/${totalVisible} aprovadas` : "Próximo"} <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}