-- ============================================================
-- INITIAL SCHEMA — Peepers Tools
-- ============================================================

-- Shared trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL DEFAULT '',
  category         TEXT        NOT NULL DEFAULT '',
  characteristics  TEXT[]               DEFAULT '{}',
  extras           TEXT                 DEFAULT '',
  photo_urls       TEXT[]               DEFAULT '{}',
  ean              TEXT,
  original_sku     TEXT,
  internal_sku     TEXT,
  sku_mapping_note TEXT,
  visual_dna       JSONB,
  status           TEXT        NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_user_created ON public.products(user_id, created_at DESC);

-- ============================================================
-- ADS  (one row per marketplace per product)
-- ============================================================
CREATE TABLE public.ads (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace  TEXT        NOT NULL,
  title        TEXT        NOT NULL DEFAULT '',
  description  TEXT        NOT NULL DEFAULT '',
  status       TEXT        NOT NULL DEFAULT 'draft',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ads_select" ON public.ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ads_insert" ON public.ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ads_update" ON public.ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ads_delete" ON public.ads FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ads_product_id   ON public.ads(product_id);
CREATE INDEX idx_ads_user_created ON public.ads(user_id, created_at DESC);

-- ============================================================
-- CREATIVES  (AI-generated images + overlays)
-- ============================================================
CREATE TABLE public.creatives (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id       UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt           TEXT        NOT NULL DEFAULT '',
  role             TEXT,
  image_url        TEXT,
  overlay_url      TEXT,
  overlay_elements JSONB,
  approved         BOOLEAN     NOT NULL DEFAULT false,
  feedback         TEXT,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creatives_select" ON public.creatives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "creatives_insert" ON public.creatives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "creatives_update" ON public.creatives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "creatives_delete" ON public.creatives FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_creatives_product_order ON public.creatives(product_id, sort_order ASC);
CREATE INDEX idx_creatives_user_id       ON public.creatives(user_id);

-- ============================================================
-- RATE LIMITS  (edge function throttling)
-- ============================================================
CREATE TABLE public.rate_limits (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL,
  function_name TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(user_id, function_name, created_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '2 hours';
$$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-photos',   'product-photos',   true),
  ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- product-photos policies
CREATE POLICY "product_photos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "product_photos_select" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-photos');

CREATE POLICY "product_photos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- generated-images policies
CREATE POLICY "generated_images_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "generated_images_select" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'generated-images');
