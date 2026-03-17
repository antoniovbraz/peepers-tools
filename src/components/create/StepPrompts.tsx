import { useState, useRef, useEffect } from "react";
import { useCreateListing, PromptCard } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Copy, Check, Upload, ThumbsUp, RefreshCw, MessageSquare, ClipboardList, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function StepPrompts() {
  const { data, updatePrompts, completeStep, goNext, goBack } = useCreateListing();
  const [prompts, setPrompts] = useState<PromptCard[]>(data.prompts);
  const [loading, setLoading] = useState(false);
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const uploadRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [generated, setGenerated] = useState(prompts.some(p => p.prompt && !p.prompt.startsWith("Prompt ")));

  const approvedCount = prompts.filter(p => p.approved).length;

  useEffect(() => {
    updatePrompts(prompts);
  }, [prompts, updatePrompts]);

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

  const copyPrompt = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyAll = () => {
    const allText = prompts.map((p, i) => `#${i + 1}\n${p.prompt}`).join("\n\n");
    navigator.clipboard.writeText(allText);
    toast({ title: "Todos os prompts copiados!" });
  };

  const handleImageUpload = (id: number, files: FileList | null) => {
    if (!files?.[0]) return;
    const url = URL.createObjectURL(files[0]);
    setPrompts(prev => prev.map(p => (p.id === id ? { ...p, imageUrl: url } : p)));
  };

  const approvePrompt = (id: number) => {
    setPrompts(prev => prev.map(p => (p.id === id ? { ...p, approved: true } : p)));
  };

  const submitFeedback = (id: number) => {
    setPrompts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, feedback: feedbackText, imageUrl: undefined, approved: false, prompt: p.prompt + "\n\n[Refinando com feedback...]" }
          : p
      )
    );
    setFeedbackId(null);
    setFeedbackText("");
    toast({ title: "Feedback enviado!", description: "O prompt será refinado" });
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
        <p className="text-sm text-muted-foreground">Copie, gere a imagem, e faça upload</p>
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
          <div
            key={p.id}
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

              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs w-full"
                onClick={() => copyPrompt(p.prompt, p.id)}
              >
                {copiedId === p.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === p.id ? "Copiado!" : "Copiar prompt"}
              </Button>

              {p.imageUrl ? (
                <div className="space-y-2">
                  <img src={p.imageUrl} alt={`Imagem ${i + 1}`} className="w-full rounded-lg aspect-square object-cover" />
                  {!p.approved && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1 bg-success hover:bg-success/90" onClick={() => approvePrompt(p.id)}>
                        <ThumbsUp className="w-3.5 h-3.5" /> Ficou boa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={() => setFeedbackId(feedbackId === p.id ? null : p.id)}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Refinar
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => uploadRefs.current[i]?.click()}
                  className="w-full border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload da imagem gerada</span>
                </button>
              )}
              <input
                ref={el => { uploadRefs.current[i] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleImageUpload(p.id, e.target.files)}
              />

              {feedbackId === p.id && (
                <div className="space-y-2 pt-2 border-t">
                  <Textarea
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder="O que ficou errado? Ex: fundo muito escuro, produto cortado..."
                    rows={3}
                  />
                  <Button size="sm" className="w-full gap-1" onClick={() => submitFeedback(p.id)}>
                    <RefreshCw className="w-3.5 h-3.5" /> Enviar e refinar prompt
                  </Button>
                </div>
              )}
            </div>
          </div>
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
