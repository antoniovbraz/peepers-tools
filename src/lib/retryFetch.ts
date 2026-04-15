import { supabase } from "@/integrations/supabase/client";

/**
 * Invoke a Supabase edge function with automatic retry on transient errors.
 * Does NOT retry on 4xx client errors (validation, auth, rate limit).
 */
export async function invokeWithRetry<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
  maxRetries = 2,
): Promise<{ data: T | null; error: Error | null }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt - 1) * 600),
      );
    }

    const result = await supabase.functions.invoke<T>(functionName, { body });

    if (!result.error) return result as { data: T; error: null };

    lastError = result.error as Error;

    // Don't retry client-side errors (4xx)
    const status =
      (result.error as unknown as { status?: number })?.status ??
      (result.error as unknown as { context?: { status?: number } })?.context?.status;
    if (typeof status === "number" && status >= 400 && status < 500) break;
  }

  return { data: null, error: lastError };
}
