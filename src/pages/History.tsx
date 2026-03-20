import { useState, useEffect } from "react";
import { ClipboardList, Trash2, Eye, Copy, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PromptData {
  prompt?: string;
  approved?: boolean;
  imageUrl?: string;
}

interface Listing {
  id: string;
  product_name: string;
  category: string;
  characteristics: string[] | null;
  extras: string | null;
  ad_mercadolivre_title: string | null;
  ad_mercadolivre_description: string | null;
  ad_shopee_title: string | null;
  ad_shopee_description: string | null;
  photo_urls: string[] | null;
  prompts: any;
  status: string;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function History() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);

  const fetchListings = async (offset = 0, append = false) => {
    if (!user) return;
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error(error);
      toast({ title: "Erro ao carregar histórico", variant: "destructive" });
    } else {
      const rows = data || [];
      if (append) {
        setListings(prev => [...prev, ...rows]);
      } else {
        setListings(rows);
      }
      setHasMore(rows.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchListings();
  }, [user]);

  const loadMore = () => {
    fetchListings(listings.length, true);
  };

  const deleteListing = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao deletar", variant: "destructive" });
    } else {
      setListings(prev => prev.filter(l => l.id !== id));
      toast({ title: "Anúncio deletado" });
    }
  };

  const duplicateListing = async (listing: Listing) => {
    if (!user) return;
    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      product_name: listing.product_name,
      category: listing.category,
      characteristics: listing.characteristics,
      extras: listing.extras,
      ad_mercadolivre_title: listing.ad_mercadolivre_title,
      ad_mercadolivre_description: listing.ad_mercadolivre_description,
      ad_shopee_title: listing.ad_shopee_title,
      ad_shopee_description: listing.ad_shopee_description,
      photo_urls: listing.photo_urls,
      prompts: listing.prompts,
      status: "draft",
    });
    if (error) {
      toast({ title: "Erro ao duplicar", variant: "destructive" });
    } else {
      toast({ title: "Anúncio duplicado!" });
      fetchListings();
    }
  };

  const getApprovedImages = (prompts: any): PromptData[] => {
    if (!Array.isArray(prompts)) return [];
    return prompts.filter((p: any) => p?.approved && p?.imageUrl);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-display text-xl font-bold text-foreground">Histórico</h2>
          <p className="text-sm text-muted-foreground">Seus anúncios criados aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <h2 className="font-display text-xl font-bold text-foreground">Histórico</h2>

      <div className="space-y-3">
        {listings.map(listing => (
          <div key={listing.id} className="bg-card rounded-xl border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {listing.photo_urls?.[0] ? (
                  <img src={listing.photo_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <Package className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{listing.product_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{listing.category}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(listing.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Badge variant={listing.status === "completed" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {listing.status === "completed" ? "Concluído" : "Rascunho"}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => setSelected(listing)}>
                <Eye className="w-3.5 h-3.5" /> Ver
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => duplicateListing(listing)}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deletar anúncio?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteListing(listing.id)}>Deletar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="outline"
          className="w-full h-11 gap-2 text-sm"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loadingMore ? "Carregando..." : "Carregar mais"}
        </Button>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.product_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">Categoria</p>
                <p>{selected.category}</p>
              </div>
              {selected.characteristics && selected.characteristics.length > 0 && (
                <div>
                  <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">Características</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.characteristics.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selected.ad_mercadolivre_title && (
                <div>
                  <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">Mercado Livre</p>
                  <p className="font-medium">{selected.ad_mercadolivre_title}</p>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{selected.ad_mercadolivre_description}</p>
                </div>
              )}
              {selected.ad_shopee_title && (
                <div>
                  <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">Shopee</p>
                  <p className="font-medium">{selected.ad_shopee_title}</p>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{selected.ad_shopee_description}</p>
                </div>
              )}
              {selected.photo_urls && selected.photo_urls.length > 0 && (
                <div>
                  <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">Fotos do Produto</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selected.photo_urls.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                    ))}
                  </div>
                </div>
              )}
              {/* AI Generated Images */}
              {getApprovedImages(selected.prompts).length > 0 && (
                <div>
                  <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">Imagens Geradas por IA</p>
                  <div className="grid grid-cols-2 gap-2 overflow-hidden">
                    {getApprovedImages(selected.prompts).map((p, i) => (
                      <img key={i} src={p.imageUrl} alt={`IA ${i + 1}`} className="w-full aspect-square rounded-lg object-cover overflow-hidden" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
