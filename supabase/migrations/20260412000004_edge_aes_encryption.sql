-- Migrate encryption from pgsodium (server-side RPC, broken in cloud) to
-- AES-GCM performed inside the edge function using Deno Web Crypto API.
-- All previous key-save attempts failed with 403 (pgsodium 42501),
-- so user_api_keys has no rows and this migration is data-safe.

-- 1. Change encrypted_key: BYTEA -> TEXT  (stores base64 AES-GCM ciphertext)
ALTER TABLE public.user_api_keys
  ALTER COLUMN encrypted_key TYPE TEXT USING encode(encrypted_key, 'base64');

-- 2. Repurpose key_id (pgsodium key-reference UUID) as key_nonce
--    (AES-GCM 12-byte IV, stored as base64 TEXT)
ALTER TABLE public.user_api_keys RENAME COLUMN key_id TO key_nonce;
ALTER TABLE public.user_api_keys
  ALTER COLUMN key_nonce TYPE TEXT USING key_nonce::TEXT;

-- 3. Drop pgsodium helper functions (no longer used)
DROP FUNCTION IF EXISTS public.encrypt_api_key(TEXT);
DROP FUNCTION IF EXISTS public.decrypt_api_key(BYTEA, UUID);
