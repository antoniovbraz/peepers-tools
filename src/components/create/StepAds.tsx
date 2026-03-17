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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <h2 className="font-display text-lg font-bold">Gerando anúncios...</h2>
        <p className="text-sm text-muted-foreground text-center">A IA está criando textos otimizados para ML e Shopee</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-display text-xl font-bold text-foreground">Anúncios</h2>
        <p className="text-sm text-muted-foreground">Textos gerados pela IA — edite à vontade</p>
      </div>

      {/* Mercado Livre */}
      <div className="bg-card rounded-xl border p-4 space-y-3">
        <Badge className="bg-[hsl(50,95%,55%)] text-black text-xs font-bold">Mercado Livre</Badge>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Título</label>
          <Input value={ml.title} onChange={e => setMl({ ...ml, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Descrição</label>
          <Textarea value={ml.description} onChange={e => setMl({ ...ml, description: e.target.value })} rows={5} />
        </div>
      </div>

      {/* Shopee */}
      <div className="bg-card rounded-xl border p-4 space-y-3">
        <Badge className="bg-[hsl(10,85%,55%)] text-white text-xs font-bold">Shopee</Badge>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Título</label>
          <Input value={shopee.title} onChange={e => setShopee({ ...shopee, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Descrição</label>
          <Textarea value={shopee.description} onChange={e => setShopee({ ...shopee, description: e.target.value })} rows={5} />
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
