import { useState, useEffect } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, RefreshCw, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function StepAds() {
  const { data, updateAds, completeStep, goNext, goBack } = useCreateListing();
  const [loading, setLoading] = useState(false);
  const [ml, setMl] = useState(data.ads.mercadoLivre);
  const [shopee, setShopee] = useState(data.ads.shopee);
  const [generated, setGenerated] = useState(!!data.ads.mercadoLivre.title);

  const generateAds = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-ads", {
        body: {
          productName: data.identification.name,
          category: data.identification.category,
          characteristics: data.identification.characteristics,
          extras: data.identification.extras,
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setMl(result.mercadoLivre);
      setShopee(result.shopee);
      setGenerated(true);
      updateAds({ mercadoLivre: result.mercadoLivre, shopee: result.shopee });
    } catch (err: any) {
      console.error("Generate ads error:", err);
      toast({ title: "Erro ao gerar anúncios", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!generated && data.identification.name) {
      generateAds();
    }
  }, []);

  const handleConfirm = () => {
    updateAds({ mercadoLivre: ml, shopee });
    completeStep(2);
    goNext();
  };

  if (loading) {
    return (
      <div className="px-4 py-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <h2 className="font-display text-lg font-bold">Gerando anúncios...</h2>
        <p className="text-sm text-muted-foreground text-center">Criando textos otimizados para Mercado Livre e Shopee</p>
        <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: "50%" }} />
        </div>
        <p className="text-xs text-muted-foreground">Estimativa: ~8 segundos</p>

        {/* Skeleton preview of expected result */}
        <div className="w-full max-w-md space-y-3 mt-4">
          <div className="bg-card rounded-xl border p-4 space-y-3">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-8 w-full bg-muted rounded animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-muted/60 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4 space-y-3">
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
            <div className="h-8 w-full bg-muted rounded animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60 italic mt-2">💡 Dica: você poderá editar todos os textos depois</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Anúncios</h2>
        <p className="text-sm text-muted-foreground">Textos gerados pela IA — edite à vontade</p>
      </div>

      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
      <div className="bg-card rounded-xl border p-4 space-y-3">
        <Badge className="bg-[hsl(50,95%,55%)] text-black text-xs font-bold">Mercado Livre</Badge>
        <div className="space-y-2">
          <label htmlFor="ml-title" className="text-xs font-semibold text-muted-foreground">Título</label>
          <Input id="ml-title" value={ml.title} onChange={e => setMl({ ...ml, title: e.target.value })} maxLength={60} />
          <div className="flex justify-end">
            <span className={`text-xs ${ml.title.length > 60 ? "text-destructive" : "text-muted-foreground"}`}>
              {ml.title.length}/60
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="ml-desc" className="text-xs font-semibold text-muted-foreground">Descrição</label>
          <Textarea id="ml-desc" value={ml.description} onChange={e => setMl({ ...ml, description: e.target.value })} rows={5} />
        </div>
      </div>

      {/* Shopee */}
      <div className="bg-card rounded-xl border p-4 space-y-3">
        <Badge className="bg-[hsl(10,85%,55%)] text-white text-xs font-bold">Shopee</Badge>
        <div className="space-y-2">
          <label htmlFor="shopee-title" className="text-xs font-semibold text-muted-foreground">Título</label>
          <Input id="shopee-title" value={shopee.title} onChange={e => setShopee({ ...shopee, title: e.target.value })} maxLength={120} />
          <div className="flex justify-end">
            <span className={`text-xs ${shopee.title.length > 120 ? "text-destructive" : "text-muted-foreground"}`}>
              {shopee.title.length}/120
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="shopee-desc" className="text-xs font-semibold text-muted-foreground">Descrição</label>
          <Textarea id="shopee-desc" value={shopee.description} onChange={e => setShopee({ ...shopee, description: e.target.value })} rows={5} />
        </div>
      </div>
      </div>
      <Button variant="outline" className="w-full gap-2" onClick={generateAds}>
        <RefreshCw className="w-4 h-4" /> Regenerar tudo
      </Button>

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button onClick={handleConfirm} disabled={!ml.title} className="flex-1 h-14 text-base font-bold gap-2">
          <Check className="w-5 h-5" /> Confirmar <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
