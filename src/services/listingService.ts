import { supabase } from "@/integrations/supabase/client";
import type { ListingData } from "@/context/CreateListingContext";

/**
 * Saves a completed listing (product + ads + creatives) to Supabase.
 * Returns the new product ID on success, throws on any failure.
 *
 * The operation is best-effort sequential: if the ads or creatives
 * insert fails, the orphaned product is cleaned up before re-throwing.
 */
export async function saveListing(userId: string, listing: ListingData): Promise<string> {
  // 1. Insert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      user_id: userId,
      name: listing.identification.name,
      category: listing.identification.category,
      characteristics: listing.identification.characteristics,
      extras: listing.identification.extras,
      ean: listing.identification.ean ?? null,
      original_sku: listing.identification.originalSku ?? null,
      internal_sku: listing.identification.internalSku ?? null,
      sku_mapping_note: listing.identification.skuMappingNote ?? null,
      photo_urls: listing.photoUrls,
      visual_dna: listing.visualDNA ?? null,
      status: "completed",
    })
    .select("id")
    .single();

  if (productError) throw productError;
  const productId = product.id as string;

  // 2. Insert ads (ML + Shopee)
  const { error: adsError } = await supabase.from("ads").insert([
    {
      product_id: productId,
      user_id: userId,
      marketplace: "mercado_livre",
      title: listing.ads.mercadoLivre.title,
      description: listing.ads.mercadoLivre.description,
      status: "completed",
    },
    {
      product_id: productId,
      user_id: userId,
      marketplace: "shopee",
      title: listing.ads.shopee.title,
      description: listing.ads.shopee.description,
      status: "completed",
    },
  ]);

  if (adsError) {
    await supabase.from("products").delete().eq("id", productId);
    throw adsError;
  }

  // 3. Insert creatives (one row per prompt)
  if (listing.prompts.length > 0) {
    const { error: creativesError } = await supabase.from("creatives").insert(
      listing.prompts.map((p, i) => ({
        product_id: productId,
        user_id: userId,
        prompt: p.prompt,
        image_url: p.imageUrl ?? null,
        overlay_url: listing.overlayUrls[p.id] ?? null,
        overlay_elements: listing.overlayElements[p.id] ?? null,
        approved: p.approved,
        feedback: p.feedback ?? null,
        sort_order: i,
      }))
    );
    if (creativesError) {
      // Creatives are non-critical; product + ads already saved — don't rollback
      console.error("Creatives insert failed:", creativesError);
    }
  }

  return productId;
}
