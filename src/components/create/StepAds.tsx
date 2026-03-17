import { useState, useEffect } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";

const marketplaces = [
  { key: "mercadoLivre" as const, label: "Mercado Livre", color: "bg-accent text-accent-foreground" },
  { key: "shopee" as const, label: "Shopee", color: "bg-destructive text-destructive-foreground" },
];

export default function StepAds() {
  const { data, updateAds, completeStep, goNext, goBack } = useCreateListing();
  const [loading, setLoading] = useState(!data.ads.mercadoLivre.title);
  const [ads, setAds] = useState(data.ads);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (data.ads.mercadoLivre.title) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      const mock = {
        mercadoLivre: {
          title: "Kit Caderno Espiral A5 Capa Dura + 6 Canetas Gel Coloridas - Paper Shop",
          description: "📒 Kit completo de papelaria premium!\n\n✅ Caderno espiral A5 com capa dura ilustrada\n✅ 80 folhas pautadas de alta gramatura\n✅ 6 canetas gel em cores vibrantes\n✅ Embalagem presenteável\n\n🎁 Perfeito para presente ou uso pessoal\n📦 Envio imediato\n\nPaper Shop - Papelaria com amor ✏️",
        },
        shopee: {
          title: "Kit Caderno A5 + Canetas Coloridas | Papelaria Fofa | Paper Shop",
          description: "🌸 Kit de papelaria mais fofo!\n\nInclui:\n• Caderno espiral A5 capa dura\n• 80 folhas pautadas\n• 6 canetas gel coloridas\n• Embalagem presenteável\n\n💝 Ideal para presentear\n🚀 Envio rápido\n\n#papelaria #caderno #canetas #presente #papershop",
        },
      };
      setAds(mock);
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [data.ads.mercadoLivre.title]);

  const handleNext = () => {
    updateAds(ads);
    completeStep(2);
    goNext();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <div className="text-center space-y-1">
          <p className="font-display font-bold text-foreground">Criando anúncios...</p>
          <p className="text-sm text-muted-foreground">Gerando textos para ML e Shopee</p>
        </div>
      </div>
    );
  }

  const mp = marketplaces[activeTab];
  const ad = ads[mp.key];

  return (
    <div className="px-4 py-6 space-y-5">
      <h2 className="font-display text-xl font-bold text-foreground text-center">Anúncios Gerados</h2>

      {/* Tabs */}
      <div className="flex gap-2">
        {marketplaces.map((m, i) => (
          <button
            key={m.key}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === i
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Ad Card */}
      <div className="bg-card rounded-xl border shadow-sm p-4 space-y-4">
        <Badge className={mp.color}>{mp.label}</Badge>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</label>
          <Input
            value={ad.title}
            onChange={e => setAds(prev => ({ ...prev, [mp.key]: { ...ad, title: e.target.value } }))}
            className="font-medium"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</label>
          <Textarea
            value={ad.description}
            onChange={e => setAds(prev => ({ ...prev, [mp.key]: { ...ad, description: e.target.value } }))}
            rows={8}
          />
        </div>

        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Regenerar
        </Button>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button onClick={handleNext} className="flex-1 h-12 text-base font-semibold gap-2">
          Gostei, próximo <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
