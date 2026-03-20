import { useState, useEffect } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Check, Edit3, Loader2, Brain, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function StepIdentify() {
  const { data, updateIdentification, completeStep, goNext, goBack } = useCreateListing();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.identification.name);
  const [category, setCategory] = useState(data.identification.category);
  const [characteristics, setCharacteristics] = useState<string[]>(data.identification.characteristics);
  const [extras, setExtras] = useState(data.identification.extras);
  const [identified, setIdentified] = useState(!!data.identification.name);

  const runAI = async () => {
    if (data.photoUrls.length === 0) {
      toast({ title: "Envie fotos primeiro", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // photoUrls are now public Storage URLs — pass them directly
      const { data: result, error } = await supabase.functions.invoke("identify-product", {
        body: { photoUrls: data.photoUrls.slice(0, 4) },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setName(result.name || "");
      setCategory(result.category || "");
      setCharacteristics(result.characteristics || []);
      setIdentified(true);
      updateIdentification({
        name: result.name || "",
        category: result.category || "",
        characteristics: result.characteristics || [],
        extras,
      });
    } catch (err: any) {
      console.error("AI identify error:", err);
      toast({ title: "Erro na IA", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!identified && data.photoUrls.length > 0) {
      runAI();
    }
  }, []);

  const handleConfirm = () => {
    updateIdentification({ name, category, characteristics, extras });
    completeStep(1);
    goNext();
  };

  if (loading) {
    return (
      <div className="px-4 py-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
          <Brain className="w-8 h-8 text-accent" />
        </div>
        <h2 className="font-display text-lg font-bold">Analisando produto...</h2>
        <p className="text-sm text-muted-foreground text-center">A IA está identificando seu produto pelas fotos</p>
        <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
        <p className="text-xs text-muted-foreground">Estimativa: ~5 segundos</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-display text-xl font-bold text-foreground">Produto Identificado</h2>
        <p className="text-sm text-muted-foreground">Confira e ajuste se necessário</p>
      </div>

      <div className="bg-card rounded-xl border p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="product-name" className="text-xs font-semibold text-muted-foreground uppercase">Nome</label>
          <Input id="product-name" value={name} onChange={e => setName(e.target.value)} disabled={!editing} />
        </div>
        <div className="space-y-2">
          <label htmlFor="product-category" className="text-xs font-semibold text-muted-foreground uppercase">Categoria</label>
          <Input id="product-category" value={category} onChange={e => setCategory(e.target.value)} disabled={!editing} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Características</label>
          <div className="flex flex-wrap gap-2">
            {characteristics.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {editing ? (
                  <input
                    className="bg-transparent border-none outline-none w-auto text-xs"
                    value={c}
                    onChange={e => {
                      const next = [...characteristics];
                      next[i] = e.target.value;
                      setCharacteristics(next);
                    }}
                  />
                ) : (
                  c
                )}
              </Badge>
            ))}
            {editing && (
              <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs" onClick={() => setCharacteristics([...characteristics, ""])}>
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Informações extras</label>
          <Textarea
            value={extras}
            onChange={e => setExtras(e.target.value)}
            placeholder="Dimensões, material, código do produto..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="gap-2" onClick={() => setEditing(!editing)}>
          <Edit3 className="w-4 h-4" /> {editing ? "Pronto" : "Editar"}
        </Button>
        <Button variant="outline" className="gap-2" onClick={runAI} disabled={loading}>
          <Brain className="w-4 h-4" /> Re-analisar
        </Button>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="h-14 px-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button onClick={handleConfirm} disabled={!name} className="flex-1 h-14 text-base font-bold gap-2">
          <Check className="w-5 h-5" /> Confirmar <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
