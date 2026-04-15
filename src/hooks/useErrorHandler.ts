import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

/** Maps common backend/network error messages to friendly PT-BR strings. */
export function friendlyMessage(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "Erro desconhecido";

  const lower = raw.toLowerCase();

  if (lower.includes("api_key_missing") || lower.includes("ai_auth_error") || lower.includes("chave de api inválida"))
    return "Chave de API inválida ou sem permissão. Verifique suas configurações.";

  if (lower.includes("ai_safety_block") || lower.includes("bloqueou o conteúdo por questões de segurança"))
    return "A IA bloqueou o conteúdo por questões de segurança. Tente com outras fotos.";

  if (lower.includes("ai_parse_error") || lower.includes("não gerou um resultado válido"))
    return "O modelo de IA não conseguiu processar as fotos. Tente novamente.";

  if (lower.includes("ai_provider_error") || lower.includes("erro do provedor"))
    return "Erro no provedor de IA. Tente novamente em instantes.";

  if (lower.includes("ai_unavailable") || lower.includes("provedor de ia") || lower.includes("indisponível"))
    return "Provedor de IA temporariamente indisponível. Tente novamente em instantes.";

  if (lower.includes("rate limit") || lower.includes("too many requests"))
    return "Limite de requisições atingido. Tente novamente em alguns minutos.";

  if (lower.includes("unauthorized") || lower.includes("jwt") || lower.includes("auth"))
    return "Sessão expirada. Faça login novamente.";

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("conexão")
  )
    return "Falha na conexão. Verifique sua internet e tente novamente.";

  if (
    lower.includes("service temporarily") ||
    lower.includes("503") ||
    lower.includes("unavailable")
  )
    return "Serviço temporariamente indisponível. Tente novamente em instantes.";

  if (lower.includes("timeout"))
    return "A requisição demorou demais. Tente novamente.";

  // Fall back to raw message (already sanitized by backend, not from user input)
  return raw;
}

/**
 * Centralized error handler hook.
 *
 * Usage:
 * ```ts
 * const handleError = useErrorHandler();
 * // inside catch:
 * handleError(err, "Erro ao gerar anúncios");
 * ```
 */
export function useErrorHandler() {
  return useCallback((err: unknown, title = "Ocorreu um erro") => {
    console.error(title, err);
    toast({
      title,
      description: friendlyMessage(err),
      variant: "destructive",
    });
  }, []);
}
