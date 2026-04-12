import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Check, X, Loader2, Trash2, User, Cpu, BarChart3, ExternalLink } from "lucide-react";

/* ── Types ── */

interface Provider {
  id: string;
  name: string;
  base_url: string;
  docs_url: string | null;
}

interface UserKey {
  id: string;
  provider_id: string;
  key_hint: string;
  is_valid: boolean;
  last_validated_at: string | null;
}

/* ── Tab Button ── */

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ── Tab: Perfil ── */

function TabProfile() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Perfil</h3>
        <p className="text-sm text-muted-foreground">Informações da sua conta</p>
      </div>

      <div className="space-y-4 bg-card border rounded-lg p-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <p className="mt-1">{user?.email || "—"}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Provedor de login</label>
          <p className="mt-1 capitalize">{user?.app_metadata?.provider || "email"}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">ID do usuário</label>
          <p className="mt-1 text-xs font-mono text-muted-foreground">{user?.id}</p>
        </div>
      </div>

      <button
        onClick={signOut}
        className="text-sm text-destructive hover:underline"
      >
        Sair da conta
      </button>
    </div>
  );
}

/* ── Tab: Provedores IA ── */

function TabProviders() {
  const { session } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userKeys, setUserKeys] = useState<UserKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-provider UI state (all keyed by provider.id to isolate each card)
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Load providers from DB
      const { data: provData } = await supabase
        .from("ai_providers")
        .select("*")
        .order("name");
      setProviders(provData || []);

      // Load user's keys (response is { keys: [...] })
      const { data: keyData, error: keyError } = await supabase.functions.invoke(
        "manage-api-keys",
        { method: "GET" }
      );
      if (!keyError && keyData?.keys) {
        setUserKeys(keyData.keys);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  // Use session user id as dependency — avoids refetch on token refresh (new object ref)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleValidateAndSave = async (providerId: string) => {
    const keyValue = (keyInputs[providerId] ?? "").trim();
    if (!keyValue) return;

    // 1. Validate
    setValidatingId(providerId);
    try {
      const { data: valResult, error: valError } = await supabase.functions.invoke(
        "validate-api-key",
        { body: { provider_id: providerId, api_key: keyValue } }
      );
      if (valError) throw valError;
      if (!valResult?.valid) {
        toast({
          title: "Chave inválida",
          description: valResult?.error || "A chave de API não foi aceita pelo provedor.",
          variant: "destructive",
        });
        return;
      }
    } catch (err) {
      toast({
        title: "Erro ao validar",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
      return;
    } finally {
      setValidatingId(null);
    }

    // 2. Save
    setSavingId(providerId);
    try {
      const { error: saveError } = await supabase.functions.invoke(
        "manage-api-keys",
        {
          method: "POST",
          body: { provider_id: providerId, api_key: keyValue },
        }
      );
      if (saveError) throw saveError;

      toast({ title: "Chave salva com sucesso!" });
      setEditingProvider(null);
      setKeyInputs((prev) => { const n = { ...prev }; delete n[providerId]; return n; });
      setShowKeys((prev) => { const n = { ...prev }; delete n[providerId]; return n; });
      await loadData();
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (providerId: string) => {
    setDeleting(providerId);
    try {
      const { error } = await supabase.functions.invoke("manage-api-keys", {
        method: "DELETE",
        body: { provider_id: providerId },
      });
      if (error) throw error;
      toast({ title: "Chave removida" });
      await loadData();
    } catch (err) {
      toast({
        title: "Erro ao remover",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Provedores de IA</h3>
        <p className="text-sm text-muted-foreground">
          Configure suas chaves de API. Cada chave é criptografada e nunca é exibida após salva.
        </p>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => {
          const existingKey = userKeys.find((k) => k.provider_id === provider.id);
          const isEditing = editingProvider === provider.id;
          const isBusy = savingId === provider.id || validatingId === provider.id;

          return (
            <div
              key={provider.id}
              className="bg-card border rounded-lg p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    {provider.docs_url && (
                      <a
                        href={provider.docs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Obter chave de API
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {existingKey && !isEditing && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="w-3 h-3" />
                      {existingKey.key_hint}
                    </span>
                    <button
                      onClick={() => {
                        setEditingProvider(provider.id);
                        setKeyInputs((prev) => ({ ...prev, [provider.id]: "" }));
                        setShowKeys((prev) => ({ ...prev, [provider.id]: false }));
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Alterar
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      disabled={deleting === provider.id}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      {deleting === provider.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Key input (show when no key or editing) */}
              {(!existingKey || isEditing) && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeys[provider.id] ? "text" : "password"}
                      value={keyInputs[provider.id] ?? ""}
                      onChange={(e) => setKeyInputs((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                      placeholder={`Cole sua chave de API do ${provider.name}`}
                      className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isBusy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleValidateAndSave(provider.id)}
                    disabled={!(keyInputs[provider.id] ?? "").trim() || isBusy}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {validatingId === provider.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Validando…
                      </>
                    ) : savingId === provider.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Salvando…
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </button>
                  {isEditing && (
                    <button
                      onClick={() => {
                        setEditingProvider(null);
                        setKeyInputs((prev) => { const n = { ...prev }; delete n[provider.id]; return n; });
                        setShowKeys((prev) => { const n = { ...prev }; delete n[provider.id]; return n; });
                      }}
                      className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Tab: Uso ── */

function TabUsage() {
  const [stats, setStats] = useState<{ function_name: string; count: number; avg_latency: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("usage_logs")
          .select("function_name, latency_ms")
          .order("created_at", { ascending: false })
          .limit(500);

        if (data) {
          // Aggregate by function
          const map = new Map<string, { count: number; totalLatency: number }>();
          for (const row of data) {
            const fn = row.function_name;
            const existing = map.get(fn) || { count: 0, totalLatency: 0 };
            existing.count++;
            existing.totalLatency += row.latency_ms || 0;
            map.set(fn, existing);
          }
          setStats(
            Array.from(map.entries()).map(([fn, { count, totalLatency }]) => ({
              function_name: fn,
              count,
              avg_latency: Math.round(totalLatency / count),
            }))
          );
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fnLabels: Record<string, string> = {
    identify: "Identificar Produto",
    ads: "Gerar Anúncios",
    prompts: "Gerar Prompts",
    image: "Gerar Imagem",
    overlay_copy: "Gerar Copy Overlay",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Uso da IA</h3>
        <p className="text-sm text-muted-foreground">Suas últimas 500 chamadas à IA</p>
      </div>

      {stats.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
          Nenhum uso registrado ainda.
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Função</th>
                <th className="text-right px-4 py-3 font-medium">Chamadas</th>
                <th className="text-right px-4 py-3 font-medium">Latência média</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.function_name} className="border-b last:border-0">
                  <td className="px-4 py-3">{fnLabels[s.function_name] || s.function_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {s.avg_latency}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Settings Page ── */

type Tab = "profile" | "providers" | "usage";

export default function Settings() {
  const [tab, setTab] = useState<Tab>("providers");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={User} label="Perfil" />
        <TabButton active={tab === "providers"} onClick={() => setTab("providers")} icon={Cpu} label="Provedores IA" />
        <TabButton active={tab === "usage"} onClick={() => setTab("usage")} icon={BarChart3} label="Uso" />
      </div>

      {tab === "profile" && <TabProfile />}
      {tab === "providers" && <TabProviders />}
      {tab === "usage" && <TabUsage />}
    </div>
  );
}
