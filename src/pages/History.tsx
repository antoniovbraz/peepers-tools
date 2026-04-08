import { useState, useEffect } from "react";
import { ClipboardList, Trash2, Eye, Copy, Loader2, Package, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

interface Product {
  id: string;
  name: string;
  category: string;
  characteristics: string[] | null;
  extras: string | null;
  photo_urls: string[] | null;
  ean: string | null;
  original_sku: string | null;
  internal_sku: string | null;
  status: string;
  created_at: string;
}

interface Ad {
  id: string;
  marketplace: string;
  title: string;
  description: string;
}

interface Creative {
  id: string;
  prompt: string;
  image_url: string | null;
  approved: boolean;
  sort_order: number;
}

interface ProductDetail extends Product {
  ads: Ad[];
  creatives: Creative[];
}

const PAGE_SIZE = 20;

export default function History() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProducts = async (offset = 0, append = false) => {
    if (!user) return;
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, characteristics, extras, photo_urls, ean, original_sku, internal_sku, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error(error);
      toast({ title: "Erro ao carregar histórico", variant: "destructive" });
    } else {
      const rows = (data || []) as Product[];
      if (append) {
        setProducts(prev => [...prev, ...rows]);
      } else {
        setProducts(rows);
      }
      setHasMore(rows.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const loadMore = () => {
    fetchProducts(products.length, true);
  };

  const openDetail = async (product: Product) => {
    setLoadingDetail(true);
    setSelected({ ...product, ads: [], creatives: [] });

    const [adsRes, creativesRes] = await Promise.all([
      supabase.from("ads").select("id, marketplace, title, description").eq("product_id", product.id).order("marketplace"),
      supabase.from("creatives").select("id, prompt, image_url, approved, sort_order").eq("product_id", product.id).order("sort_order"),
    ]);

    setSelected({
      ...product,
      ads: (adsRes.data || []) as Ad[],
      creatives: (creativesRes.data || []) as Creative[],
    });
    setLoadingDetail(false);
  };

  const deleteProduct = async (id: string) => {
    // Cascade deletes ads + creatives automatically
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao deletar", variant: "destructive" });
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (selected?.id === id) setSelected(null);
      toast({ title: "Produto deletado" });
    }
  };

  const duplicateProduct = async (product: Product) => {
    if (!user) return;
    // 1. Insert duplicate product
    const { data: newProduct, error: productError } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        name: product.name,
        category: product.category,
        characteristics: product.characteristics,
        extras: product.extras,
        ean: product.ean,
        original_sku: product.original_sku,
        internal_sku: product.internal_sku,
        photo_urls: product.photo_urls,
        status: "draft",
      })
      .select("id")
      .single();

    if (productError || !newProduct) {
      toast({ title: "Erro ao duplicar", variant: "destructive" });
      return;
    }

    // 2. Copy ads
    const { data: existingAds, error: adsReadError } = await supabase.from("ads").select("marketplace, title, description").eq("product_id", product.id);
    if (adsReadError) {
      await supabase.from("products").delete().eq("id", newProduct.id);
      toast({ title: "Erro ao duplicar anúncios", variant: "destructive" });
      return;
    }
    if (existingAds && existingAds.length > 0) {
      const { error: adsInsertError } = await supabase.from("ads").insert(existingAds.map(a => ({ ...a, product_id: newProduct.id, user_id: user.id, status: "draft" })));
      if (adsInsertError) {
        await supabase.from("products").delete().eq("id", newProduct.id);
        toast({ title: "Erro ao duplicar anúncios", variant: "destructive" });
        return;
      }
    }

    // 3. Copy creatives
    const { data: existingCreatives, error: creativesReadError } = await supabase.from("creatives").select("prompt, image_url, approved, sort_order").eq("product_id", product.id);
    if (!creativesReadError && existingCreatives && existingCreatives.length > 0) {
      await supabase.from("creatives").insert(existingCreatives.map(c => ({ ...c, product_id: newProduct.id, user_id: user.id })));
    }

    toast({ title: "Produto duplicado!" });
    fetchProducts();
  };

  const filteredProducts = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-display text-xl font-bold text-foreground">Histórico</h2>
          <p className="text-sm text-muted-foreground">Seus produtos criados aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-4 max-w-7xl mx-auto">
      <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Histórico</h2>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou categoria..."
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-card rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {product.photo_urls?.[0] ? (
                  <img src={product.photo_urls[0]} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <Package className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{product.name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(product.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Badge variant={product.status === "completed" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {product.status === "completed" ? "Concluído" : "Rascunho"}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => openDetail(product)}>
                <Eye className="w-3.5 h-3.5" /> Ver
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => duplicateProduct(product)}>
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
                    <AlertDialogTitle>Deletar produto?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação removerá o produto, anúncios e imagens. Não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteProduct(product.id)}>Deletar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && search && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum produto encontrado para "{search}"</p>
      )}

      {hasMore && !search && (
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

      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              {loadingDetail && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando detalhes...
                </div>
              )}
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
              {(selected.ean || selected.original_sku) && (
                <div className="flex gap-4">
                  {selected.ean && (
                    <div>
                      <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">EAN</p>
                      <p className="font-mono text-xs">{selected.ean}</p>
                    </div>
                  )}
                  {selected.original_sku && (
                    <div>
                      <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">SKU Embalagem</p>
                      <p className="font-mono text-xs">{selected.original_sku}</p>
                    </div>
                  )}
                </div>
              )}
              {selected.ads.map(ad => (
                <div key={ad.id}>
                  <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">
                    {ad.marketplace === "mercado_livre" ? "Mercado Livre" : "Shopee"}
                  </p>
                  <p className="font-medium">{ad.title}</p>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{ad.description}</p>
                </div>
              ))}
              {selected.photo_urls && selected.photo_urls.length > 0 && (
                <div>
                  <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">Fotos do Produto</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selected.photo_urls.map((url, i) => (
                      <img key={i} src={url} alt="" loading="lazy" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                    ))}
                  </div>
                </div>
              )}
              {selected.creatives.filter(c => c.approved && c.image_url).length > 0 && (
                <div>
                  <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">Imagens Geradas por IA</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.creatives.filter(c => c.approved && c.image_url).map(c => (
                      <img key={c.id} src={c.image_url!} alt="" className="w-full aspect-square rounded-lg object-cover" />
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
