import { useState, useEffect } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function StepIdentify() {
  const { data, updateIdentification, completeStep, goNext, goBack } = useCreateListing();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(data.identification.name);
  const [category, setCategory] = useState(data.identification.category);
  const [characteristics, setCharacteristics] = useState<string[]>(data.identification.characteristics);
  const [extras, setExtras] = useState(data.identification.extras);
  const [showExtras, setShowExtras] = useState(false);

  // Simulate AI identification
  useEffect(() => {
    if (data.identification.name) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      const mock = {
        name: "Kit Caderno Espiral A5 + Canetas Coloridas",
        category: "Papelaria / Cadernos",
        characteristics: ["Caderno espiral A5", "Capa dura ilustrada", "80 folhas pautadas", "Kit com 6 canetas gel coloridas", "Embalagem presenteável"],
      };
      setName(mock.name);
      setCategory(mock.category);
      setCharacteristics(mock.characteristics);
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [data.identification.name]);

  const handleNext = () => {
    updateIdentification({ name, category, characteristics, extras });
    completeStep(1);
    goNext();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-display font-bold text-foreground">Analisando fotos...</p>
          <p className="text-sm text-muted-foreground">A IA está identificando o produto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-primary">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Identificação da IA</span>
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Confira o resultado</h2>
      </div>

      <div className="space-y-4 bg-card rounded-xl p-4 border shadow-sm">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome do Produto</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="font-medium" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</label>
          <Input value={category} onChange={e => setCategory(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Características</label>
          <div className="flex flex-wrap gap-2">
            {characteristics.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
            ))}
          </div>
        </div>
      </div>

      {!showExtras ? (
        <button
          onClick={() => setShowExtras(true)}
          className="text-sm text-primary font-medium underline underline-offset-2"
        >
          + Adicionar informações extras
        </button>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Especificações extras</label>
          <Textarea
            value={extras}
            onChange={e => setExtras(e.target.value)}
            placeholder="Ex: material premium, edição limitada, dimensões..."
            rows={3}
          />
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button onClick={handleNext} className="flex-1 h-12 text-base font-semibold gap-2">
          Tá correto, próximo <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
