-- Migrate existing data from listings → products + ads + creatives
-- listings table is kept intact and will be dropped in a future migration
-- after all clients have been updated to use the new tables.
DO $$
DECLARE
  listing_row RECORD;
  new_product_id UUID;
  prompt_item JSONB;
  sort INTEGER;
BEGIN
  FOR listing_row IN SELECT * FROM public.listings LOOP

    -- Insert product
    INSERT INTO public.products (
      user_id, name, category, characteristics, extras,
      photo_urls, status, created_at, updated_at
    ) VALUES (
      listing_row.user_id,
      listing_row.product_name,
      listing_row.category,
      listing_row.characteristics,
      listing_row.extras,
      listing_row.photo_urls,
      listing_row.status,
      listing_row.created_at,
      listing_row.updated_at
    ) RETURNING id INTO new_product_id;

    -- Insert Mercado Livre ad (if present)
    IF listing_row.ad_mercadolivre_title IS NOT NULL
       OR listing_row.ad_mercadolivre_description IS NOT NULL THEN
      INSERT INTO public.ads (
        product_id, user_id, marketplace, title, description,
        status, created_at, updated_at
      ) VALUES (
        new_product_id,
        listing_row.user_id,
        'mercado_livre',
        COALESCE(listing_row.ad_mercadolivre_title, ''),
        COALESCE(listing_row.ad_mercadolivre_description, ''),
        listing_row.status,
        listing_row.created_at,
        listing_row.updated_at
      );
    END IF;

    -- Insert Shopee ad (if present)
    IF listing_row.ad_shopee_title IS NOT NULL
       OR listing_row.ad_shopee_description IS NOT NULL THEN
      INSERT INTO public.ads (
        product_id, user_id, marketplace, title, description,
        status, created_at, updated_at
      ) VALUES (
        new_product_id,
        listing_row.user_id,
        'shopee',
        COALESCE(listing_row.ad_shopee_title, ''),
        COALESCE(listing_row.ad_shopee_description, ''),
        listing_row.status,
        listing_row.created_at,
        listing_row.updated_at
      );
    END IF;

    -- Insert creatives from prompts JSONB array
    IF listing_row.prompts IS NOT NULL
       AND jsonb_typeof(listing_row.prompts) = 'array'
       AND jsonb_array_length(listing_row.prompts) > 0 THEN
      sort := 0;
      FOR prompt_item IN
        SELECT value FROM jsonb_array_elements(listing_row.prompts)
      LOOP
        INSERT INTO public.creatives (
          product_id, user_id, prompt, image_url, approved, sort_order, created_at
        ) VALUES (
          new_product_id,
          listing_row.user_id,
          COALESCE(prompt_item->>'prompt', ''),
          NULLIF(prompt_item->>'imageUrl', ''),
          COALESCE((prompt_item->>'approved')::boolean, false),
          sort,
          listing_row.created_at
        );
        sort := sort + 1;
      END LOOP;
    END IF;

  END LOOP;
END $$;
