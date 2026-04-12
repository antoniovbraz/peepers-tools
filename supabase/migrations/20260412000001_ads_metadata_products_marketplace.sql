-- ============================================================
-- ADD marketplace + suggested_category TO products
-- ADD metadata JSONB TO ads (for Amazon bullets/backend_search_terms)
-- ============================================================

-- products: store which marketplace the listing was optimised for
-- and the normalised category key returned by identify-product
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS marketplace        TEXT,
  ADD COLUMN IF NOT EXISTS suggested_category TEXT;

-- ads: store marketplace-specific structured data
-- (Amazon: bullets[], backend_search_terms; extensible for future marketplaces)
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS metadata JSONB;
