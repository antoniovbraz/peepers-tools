import { useCreateListing } from "@/context/CreateListingContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Check, PartyPopper, Image, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function StepExport() {
  const { data, completeStep, goBack } = useCreateListing();

  const approvedImages = data.prompts.filter(p => p.approved && p.imageUrl);

  const handleExport = async () => {
    // For now, just mark as complete. JSZip integration will come with backend.
    completeStep(4);
    toast({
      title: "🎉 Anúncio completo!",
      description: "O ZIP será gerado quando integrarmos o backend.",
    });
  };

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mx-auto">
          <PartyPopper className="w-7 h-7 text-success" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Revisão Final</h2>
        <p className="text-sm text-muted-foreground">Confira tudo antes de exportar</p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3">
        {/* Photos */}
        <div className="bg-card rounded-xl border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Fotos do Produto</span>
            <Badge variant="secondary" className="text-xs ml-auto">{data.photoUrls.length}</Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {data.photoUrls.map((url, i) => (
              <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Product ID */}
        <div className="bg-card rounded-xl border p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold">Produto Identificado</span>
          </div>
          <p className="text-sm text-muted-foreground">{data.identification.name || "—"}</p>
        </div>

        {/* Ads */}
        <div className="bg-card rounded-xl border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Anúncios</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ML: {data.ads.mercadoLivre.title || "—"}</p>
            <p className="text-xs text-muted-foreground">Shopee: {data.ads.shopee.title || "—"}</p>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card rounded-xl border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold">Imagens Geradas</span>
            <Badge variant="secondary" className="text-xs ml-auto">{approvedImages.length}/7</Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {approvedImages.map((p, i) => (
              <img key={i} src={p.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* ZIP Preview */}
      <div className="bg-muted rounded-xl p-4 space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conteúdo do ZIP</span>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>📄 mercado-livre.txt (título + descrição)</li>
          <li>📄 shopee.txt (título + descrição)</li>
          <li>📁 fotos-produto/ ({data.photoUrls.length} imagens)</li>
          <li>📁 imagens-geradas/ ({approvedImages.length} imagens)</li>
          <li>📄 prompts.txt (7 prompts)</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button onClick={handleExport} className="flex-1 h-14 text-base font-bold gap-2 bg-success hover:bg-success/90">
          <Download className="w-5 h-5" /> Exportar ZIP
        </Button>
      </div>
    </div>
  );
}
