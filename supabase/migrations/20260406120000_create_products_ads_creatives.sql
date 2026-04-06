-- Create products table (replaces the monolithic listings table)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  characteristics TEXT[] DEFAULT '{}',
  extras TEXT DEFAULT '',
  photo_urls TEXT[] DEFAULT '{}',
  -- Product codes (all optional — progressive fill)
  ean TEXT,
  original_sku TEXT,
  internal_sku TEXT,
  sku_mapping_note TEXT,
  -- Campaign DNA (persisted; previously lost)
  visual_dna JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own products"
  ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_user_created ON public.products(user_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────
-- Create ads table (one row per marketplace per product)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- user_id denormalized here so RLS policies are simple (no JOINs needed)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL, -- 'mercado_livre', 'shopee', extensible
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ads"
  ON public.ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ads"
  ON public.ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads"
  ON public.ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads"
  ON public.ads FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ads_product_id ON public.ads(product_id);
CREATE INDEX idx_ads_user_id ON public.ads(user_id);
CREATE INDEX idx_ads_user_created ON public.ads(user_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────
-- Create creatives table (AI-generated images + overlays per product)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- user_id denormalized for RLS
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL DEFAULT '',
  role TEXT, -- 'hero', 'benefits', 'features', 'closeup', 'lifestyle', 'portability', 'inbox'
  image_url TEXT,
  overlay_url TEXT,        -- previously lost; now persisted
  overlay_elements JSONB,  -- previously lost; now persisted
  approved BOOLEAN NOT NULL DEFAULT false,
  feedback TEXT,           -- previously lost; now persisted
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own creatives"
  ON public.creatives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own creatives"
  ON public.creatives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own creatives"
  ON public.creatives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own creatives"
  ON public.creatives FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_creatives_product_id ON public.creatives(product_id);
CREATE INDEX idx_creatives_user_id ON public.creatives(user_id);
CREATE INDEX idx_creatives_product_order ON public.creatives(product_id, sort_order ASC);
