-- Grant EXECUTE on encryption functions to service_role.
-- The byok_schema migration revoked from PUBLIC but never explicitly granted
-- to service_role, causing 403 (42501) when the edge function calls encrypt_api_key.

GRANT EXECUTE ON FUNCTION public.encrypt_api_key(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(BYTEA, UUID) TO service_role;
