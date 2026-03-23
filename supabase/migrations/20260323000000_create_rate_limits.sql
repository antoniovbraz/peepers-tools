-- Rate limiting table for edge function calls
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for efficient lookups by user + function within time window
CREATE INDEX idx_rate_limits_user_fn_time
  ON public.rate_limits (user_id, function_name, created_at DESC);

-- Enable RLS (service role bypasses RLS)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup: delete entries older than 2 hours to keep table small
-- This runs via pg_cron if available, otherwise manual cleanup
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '2 hours';
$$;
