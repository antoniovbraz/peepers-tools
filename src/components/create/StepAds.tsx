import { useState, useEffect } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, RefreshCw, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Checkbox } from "@/components/ui/checkbox";

export default function StepAds() {
  const { data, updateAds, updateIncludeBrand, completeStep, goNext, goBack } = useCreateListing();
  const handleError = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"mercadoLivre" | "shopee" | "amazon" | "magalu">("mercadoLivre");
  const [ml, setMl] = useState(data.ads.mercadoLivre);
  const [shopee, setShopee] = useState(data.ads.shopee);
  const [amazon, setAmazon] = useState(data.ads.amazon ?? { title: "", description: "", bullets: [] as string[] });
  const [magalu, setMagalu] = useState(data.ads.magalu ?? { title: "", description: "" });
  const [includeBrand, setIncludeBrand] = useState(data.includeBrand);
  const [generated, setGenerated] = useState(!!data.ads.mercadoLivre.title);

  const generateAds = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-ads", {
        body: {
          productName: data.identification.name,
          category: data.identification.category,
          suggested_category: data.identification.suggested_category,
          characteristics: data.identification.characteristics,
          extras: data.identification.extras,
          marketplace: "all",
          includeBrand,
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setMl(result.mercadoLivre);
      setShopee(result.shopee);
      if (result.amazon) setAmazon(result.amazon);
      if (result.magalu) setMagalu(result.magalu);
      setGenerated(true);
      updateAds({ mercadoLivre: result.mercadoLivre, shopee: result.shopee, amazon: result.amazon, magalu: result.magalu });
    } catch (err) {
      handleError(err, "Erro ao gerar anúncios");
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
    updateAds({ mercadoLivre: ml, shopee, amazon, magalu });
    completeStep(2);
    goNext();
  };

  const handleIncludeBrandChange = (checked: boolean) => {
    setIncludeBrand(checked);
    updateIncludeBrand(checked);
  };

  if (loading) {
    return (
      <div className="px-4 py-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <h2 className="font-display text-lg font-bold">Gerando anúncios...</h2>
        <p className="text-sm text-muted-foreground text-center">Criando textos otimizados para todos os marketplaces</p>
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

      {/* Brand toggle */}
      <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border">
        <Checkbox
          id="include-brand"
          checked={includeBrand}
          onCheckedChange={(v) => handleIncludeBrandChange(v === true)}
        />
        <label htmlFor="include-brand" className="text-sm cursor-pointer select-none">
          Incluir marca no título
        </label>
        <span className="text-xs text-muted-foreground ml-1">(padrão: sem marca nos títulos)</span>
      </div>

      {/* Marketplace tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Marketplace">
        {(["mercadoLivre", "shopee", "amazon", "magalu"] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab === "mercadoLivre" ? "Mercado Livre" : tab === "shopee" ? "Shopee" : tab === "amazon" ? "Amazon" : "Magalu"}
          </button>
        ))}
      </div>

      {/* Mercado Livre */}
      {activeTab === "mercadoLivre" && (
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
            <Textarea id="ml-desc" value={ml.description} onChange={e => setMl({ ...ml, description: e.target.value })} rows={6} />
          </div>
        </div>
      )}

      {/* Shopee */}
      {activeTab === "shopee" && (
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
            <Textarea id="shopee-desc" value={shopee.description} onChange={e => setShopee({ ...shopee, description: e.target.value })} rows={6} />
          </div>
        </div>
      )}

      {/* Amazon */}
      {activeTab === "amazon" && (
        <div className="bg-card rounded-xl border p-4 space-y-3">
          <Badge className="bg-[hsl(210,90%,45%)] text-white text-xs font-bold">Amazon</Badge>
          <div className="space-y-2">
            <label htmlFor="amazon-title" className="text-xs font-semibold text-muted-foreground">Título</label>
            <Input id="amazon-title" value={amazon.title} onChange={e => setAmazon({ ...amazon, title: e.target.value })} maxLength={200} />
            <div className="flex justify-end">
              <span className={`text-xs ${amazon.title.length > 200 ? "text-destructive" : "text-muted-foreground"}`}>
                {amazon.title.length}/200
              </span>
            </div>
          </div>
          {amazon.bullets && amazon.bullets.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Bullet Points (5)</label>
              {amazon.bullets.map((b, i) => (
                <Input
                  key={i}
                  value={b}
                  onChange={e => {
                    const next = [...(amazon.bullets ?? [])];
                    next[i] = e.target.value;
                    setAmazon({ ...amazon, bullets: next });
                  }}
                  maxLength={200}
                />
              ))}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="amazon-desc" className="text-xs font-semibold text-muted-foreground">Descrição</label>
            <Textarea id="amazon-desc" value={amazon.description} onChange={e => setAmazon({ ...amazon, description: e.target.value })} rows={5} />
          </div>
        </div>
      )}

      {/* Magalu */}
      {activeTab === "magalu" && (
        <div className="bg-card rounded-xl border p-4 space-y-3">
          <Badge className="bg-[hsl(320,85%,45%)] text-white text-xs font-bold">Magazine Luiza</Badge>
          <div className="space-y-2">
            <label htmlFor="magalu-title" className="text-xs font-semibold text-muted-foreground">Título</label>
            <Input id="magalu-title" value={magalu.title} onChange={e => setMagalu({ ...magalu, title: e.target.value })} maxLength={150} />
            <div className="flex justify-end">
              <span className={`text-xs ${magalu.title.length > 150 ? "text-destructive" : "text-muted-foreground"}`}>
                {magalu.title.length}/150
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="magalu-desc" className="text-xs font-semibold text-muted-foreground">Descrição</label>
            <Textarea id="magalu-desc" value={magalu.description} onChange={e => setMagalu({ ...magalu, description: e.target.value })} rows={5} />
          </div>
        </div>
      )}

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
