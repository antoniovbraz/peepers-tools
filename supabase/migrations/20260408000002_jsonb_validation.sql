-- Ensure visual_dna JSONB contains required top-level keys
ALTER TABLE products
  ADD CONSTRAINT chk_visual_dna_keys
  CHECK (
    visual_dna IS NULL
    OR (
      jsonb_typeof(visual_dna) = 'object'
      AND visual_dna ? 'background'
      AND visual_dna ? 'lighting'
      AND visual_dna ? 'style'
      AND visual_dna ? 'tone'
      AND visual_dna ? 'accentColor'
      AND visual_dna ? 'headlineColor'
    )
  );

-- Ensure overlay_elements JSONB is an array when present
ALTER TABLE creatives
  ADD CONSTRAINT chk_overlay_elements_array
  CHECK (
    overlay_elements IS NULL
    OR jsonb_typeof(overlay_elements) = 'array'
  );
