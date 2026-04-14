import { useState, useEffect, useRef } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Check, Edit3, Brain, Plus, ChevronDown, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CATEGORIES } from "@/lib/knowledgeCategories";

export default function StepIdentify() {
  const { data, updateIdentification, completeStep, goNext, goBack } = useCreateListing();
  const handleError = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.identification.name);
  const [category, setCategory] = useState(data.identification.category);
  const [suggestedCategory, setSuggestedCategory] = useState(data.identification.suggested_category ?? "");
  const [characteristics, setCharacteristics] = useState<string[]>(data.identification.characteristics);
  const [extras, setExtras] = useState(data.identification.extras);
  const [ean, setEan] = useState(data.identification.ean ?? "");
  const [originalSku, setOriginalSku] = useState(data.identification.originalSku ?? "");
  const [internalSku, setInternalSku] = useState(data.identification.internalSku ?? "");
  const [skuMappingNote, setSkuMappingNote] = useState(data.identification.skuMappingNote ?? "");
  const [fichaOpen, setFichaOpen] = useState(false);
  const [identified, setIdentified] = useState(!!data.identification.name);
  // Tracks the photo set that last triggered an auto-run, so re-uploading
  // a completely different product forces AI to re-identify.
  const autoRunPhotoKey = useRef<string | null>(null);

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
      if (result.suggested_category) setSuggestedCategory(result.suggested_category);
      setCharacteristics(result.characteristics || []);
      if (result.ean) setEan(result.ean);
      if (result.original_sku) setOriginalSku(result.original_sku);
      setIdentified(true);
      updateIdentification({
        name: result.name || "",
        category: result.category || "",
        suggested_category: result.suggested_category || "",
        characteristics: result.characteristics || [],
        extras,
        ean: result.ean ?? ean,
        originalSku: result.original_sku ?? originalSku,
        internalSku,
        skuMappingNote,
      });
    } catch (err) {
      handleError(err, "Erro na IA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const photoKey = data.photoUrls.join("|");
    // Auto-run when: not yet identified, photos exist, and this exact photo set
    // hasn't triggered a run before (prevents double-invocation in StrictMode).
    if (!identified && data.photoUrls.length > 0 && autoRunPhotoKey.current !== photoKey) {
      autoRunPhotoKey.current = photoKey;
      runAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.photoUrls, identified]);

  const handleConfirm = () => {
    updateIdentification({ name, category, suggested_category: suggestedCategory, characteristics, extras, ean, originalSku, internalSku, skuMappingNote });
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
        <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Produto Identificado</h2>
        <p className="text-sm text-muted-foreground">Confira e ajuste se necessário</p>
      </div>

      <div className="bg-card rounded-xl border p-4 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        <div className="space-y-2">
          <label htmlFor="product-name" className="text-xs font-semibold text-muted-foreground uppercase">Nome</label>
          <Input id="product-name" value={name} onChange={e => setName(e.target.value)} disabled={!editing} />
        </div>
        <div className="space-y-2">
          <label htmlFor="product-category" className="text-xs font-semibold text-muted-foreground uppercase">Categoria</label>
          <Input id="product-category" value={category} onChange={e => setCategory(e.target.value)} disabled={!editing} />
          {suggestedCategory && (
            <div className="flex items-center gap-1.5 mt-1">
              <Tag className="w-3 h-3 text-accent" />
              <span className="text-xs text-muted-foreground">Guia de conteúdo:</span>
              {editing ? (
                <select
                  className="text-xs bg-transparent border border-border rounded px-1 py-0.5"
                  value={suggestedCategory}
                  onChange={e => setSuggestedCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <Badge variant="outline" className="text-xs h-5 py-0">
                  {CATEGORIES.find(c => c.key === suggestedCategory)?.label ?? suggestedCategory}
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
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
        <div className="space-y-2 md:col-span-2">
          <Textarea
            value={extras}
            onChange={e => setExtras(e.target.value)}
            placeholder="Dimensões, material, código do produto..."
            rows={2}
          />
        </div>
      </div>

      <Collapsible open={fichaOpen} onOpenChange={setFichaOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform ${fichaOpen ? "rotate-180" : ""}`} />
            Ficha Técnica (EAN / SKU)
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 bg-muted/40 rounded-xl border p-4 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">EAN / GTIN</label>
              <Input
                value={ean}
                onChange={e => setEan(e.target.value)}
                placeholder="Ex: 7891234567890"
                maxLength={14}
              />
              <p className="text-xs text-muted-foreground">Preenchido pela IA se visível na embalagem</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">SKU da Embalagem</label>
              <Input
                value={originalSku}
                onChange={e => setOriginalSku(e.target.value)}
                placeholder="Ex: ABC-12345"
              />
              <p className="text-xs text-muted-foreground">SKU do fabricante (lido da embalagem pela IA)</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">SKU Interno</label>
              <Input
                value={internalSku}
                onChange={e => setInternalSku(e.target.value)}
                placeholder="Ex: PAPE-STABILO-80-AZ"
              />
              <p className="text-xs text-muted-foreground">Seu código interno de controle de estoque</p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Nota de Mapeamento</label>
              <Textarea
                value={skuMappingNote}
                onChange={e => setSkuMappingNote(e.target.value)}
                placeholder="Ex: variante azul = reorder 001, amarela = reorder 002"
                rows={2}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
