import { useState, useRef, useEffect } from "react";
import { useCreateListing, PromptCard } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Copy, Check, Upload, ThumbsUp, RefreshCw, MessageSquare, ClipboardList, Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PromptCardItem from "./PromptCardItem";

export default function StepPrompts() {
  const { data, updatePrompts, completeStep, goNext, goBack } = useCreateListing();
  const [prompts, setPrompts] = useState<PromptCard[]>(data.prompts);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(prompts.some(p => p.prompt && p.prompt.length > 20));

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

      const newPrompts = (result.prompts || []).slice(0, 7).map((text: string, i: number) => ({
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

      <div className="space-y-4">
        {prompts.map((p, i) => (
          <PromptCardItem
            key={p.id}
            prompt={p}
            index={i}
            onUpdate={updatePrompt}
            photos={data.photos}
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
