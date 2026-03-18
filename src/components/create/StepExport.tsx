import { useState } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Check, PartyPopper, Image, FileText, Loader2, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function StepExport() {
  const { data, completeStep, goBack } = useCreateListing();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const approvedImages = data.prompts.filter(p => p.approved && p.imageUrl);

  const handleExport = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        product_name: data.identification.name,
        category: data.identification.category,
        characteristics: data.identification.characteristics,
        extras: data.identification.extras,
        ad_mercadolivre_title: data.ads.mercadoLivre.title,
        ad_mercadolivre_description: data.ads.mercadoLivre.description,
        ad_shopee_title: data.ads.shopee.title,
        ad_shopee_description: data.ads.shopee.description,
        prompts: data.prompts.map(p => ({ prompt: p.prompt, approved: p.approved })),
        photo_urls: data.photoUrls,
        status: "completed",
      });

      if (error) throw error;

      completeStep(4);
      toast({ title: "🎉 Anúncio salvo!", description: "Seu anúncio foi salvo com sucesso." });
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // Ad texts
      const mlText = `Título: ${data.ads.mercadoLivre.title}\n\nDescrição:\n${data.ads.mercadoLivre.description}`;
      const shopeeText = `Título: ${data.ads.shopee.title}\n\nDescrição:\n${data.ads.shopee.description}`;
      zip.file("anuncio_mercadolivre.txt", mlText);
      zip.file("anuncio_shopee.txt", shopeeText);

      // Product photos
      const photosFolder = zip.folder("fotos_produto");
      for (let i = 0; i < data.photoUrls.length; i++) {
        try {
          const resp = await fetch(data.photoUrls[i]);
          const blob = await resp.blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          photosFolder?.file(`foto_${i + 1}.${ext}`, blob);
        } catch { /* skip failed photos */ }
      }

      // AI generated images
      const aiFolder = zip.folder("imagens_ia");
      for (let i = 0; i < approvedImages.length; i++) {
        const img = approvedImages[i];
        if (!img.imageUrl) continue;
        try {
          if (img.imageUrl.startsWith("data:")) {
            const parts = img.imageUrl.split(",");
            const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
            const ext = mime.includes("png") ? "png" : "jpg";
            const binary = atob(parts[1]);
            const arr = new Uint8Array(binary.length);
            for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j);
            aiFolder?.file(`imagem_ia_${i + 1}.${ext}`, arr);
          } else {
            const resp = await fetch(img.imageUrl);
            const blob = await resp.blob();
            const ext = blob.type.includes("png") ? "png" : "jpg";
            aiFolder?.file(`imagem_ia_${i + 1}.${ext}`, blob);
          }
        } catch { /* skip failed images */ }
      }

      // Prompts
      const promptsText = data.prompts.map((p, i) => `#${i + 1}\n${p.prompt}`).join("\n\n---\n\n");
      zip.file("prompts.txt", promptsText);

      const blob = await zip.generateAsync({ type: "blob" });
      const safeName = (data.identification.name || "anuncio").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
      saveAs(blob, `${safeName}.zip`);
      toast({ title: "Download iniciado!" });
    } catch (err: any) {
      console.error("ZIP error:", err);
      toast({ title: "Erro ao criar ZIP", description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mx-auto">
          <PartyPopper className="w-7 h-7 text-success" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Revisão Final</h2>
        <p className="text-sm text-muted-foreground">Confira tudo antes de salvar</p>
      </div>

      <div className="space-y-3">
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

        <div className="bg-card rounded-xl border p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold">Produto Identificado</span>
          </div>
          <p className="text-sm text-muted-foreground">{data.identification.name || "—"}</p>
        </div>

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

      <div className="space-y-3">
        <div className="flex gap-3">
          <Button variant="outline" onClick={goBack} className="h-12 px-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button onClick={handleExport} disabled={saving} className="flex-1 h-14 text-base font-bold gap-2 bg-success hover:bg-success/90">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {saving ? "Salvando..." : "Salvar Anúncio"}
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadZip}
          disabled={downloading}
          className="w-full h-12 gap-2 text-sm font-semibold"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
          {downloading ? "Criando ZIP..." : "Baixar ZIP com tudo"}
        </Button>
      </div>
    </div>
  );
}
