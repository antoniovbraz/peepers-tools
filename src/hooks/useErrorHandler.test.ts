import { describe, it, expect } from "vitest";
import { friendlyMessage } from "./useErrorHandler";

describe("friendlyMessage", () => {
  it("returns friendly message for API key errors", () => {
    expect(friendlyMessage(new Error("api_key_missing"))).toContain("Chave de API");
    expect(friendlyMessage("ai_auth_error")).toContain("Chave de API");
    expect(friendlyMessage(new Error("Chave de API inválida"))).toContain("Chave de API");
  });

  it("returns friendly message for AI unavailability", () => {
    expect(friendlyMessage(new Error("ai_unavailable"))).toContain("indisponível");
    expect(friendlyMessage("Provedor de IA temporariamente indisponível")).toContain("indisponível");
  });

  it("returns friendly message for rate limits", () => {
    expect(friendlyMessage(new Error("rate limit exceeded"))).toContain("Limite");
    expect(friendlyMessage(new Error("Too Many Requests"))).toContain("Limite");
  });

  it("returns friendly message for auth errors", () => {
    expect(friendlyMessage(new Error("Unauthorized"))).toContain("Sessão expirada");
    expect(friendlyMessage(new Error("JWT expired"))).toContain("login");
  });

  it("returns friendly message for network errors", () => {
    expect(friendlyMessage(new Error("Failed to fetch"))).toContain("conexão");
    expect(friendlyMessage(new Error("network error"))).toContain("internet");
  });

  it("returns friendly message for service unavailable", () => {
    expect(friendlyMessage(new Error("503 Service Temporarily Unavailable"))).toContain("indisponível");
  });

  it("returns friendly message for timeouts", () => {
    expect(friendlyMessage(new Error("Request timeout"))).toContain("demorou");
  });

  it("returns raw message for unknown errors", () => {
    expect(friendlyMessage(new Error("Something weird happened"))).toBe("Something weird happened");
  });

  it("handles non-Error non-string values", () => {
    expect(friendlyMessage(42)).toBe("Erro desconhecido");
    expect(friendlyMessage(null)).toBe("Erro desconhecido");
    expect(friendlyMessage(undefined)).toBe("Erro desconhecido");
  });

  it("handles plain string input", () => {
    expect(friendlyMessage("timeout on request")).toContain("demorou");
  });
});
