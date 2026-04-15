import { supabase } from "@/integrations/supabase/client";

/**
 * Try to extract the backend error message from a Supabase FunctionsHttpError.
 * The Supabase client sets `error.context` to the raw Response object, which
 * contains the actual JSON body with `{ error, error_code }`.
 */
async function extractErrorMessage(error: Error): Promise<Error> {
  try {
    const context = (error as unknown as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      const body = await context.json();
      if (body?.error && typeof body.error === "string") {
        const enriched = new Error(body.error);
        enriched.name = error.name;
        return enriched;
      }
    }
  } catch {
    // Response body already consumed or not JSON — keep original error
  }
  return error;
}

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

  // Extract the real backend error message before returning
  if (lastError) {
    lastError = await extractErrorMessage(lastError);
  }

  return { data: null, error: lastError };
}
