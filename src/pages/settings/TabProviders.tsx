import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Check, X, Loader2, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import type { Provider, UserKey, AIModel, AIFunction, ProfileId, FunctionConfig } from "./types";
import { AI_FUNCTIONS, FUNCTION_LABELS, FUNCTION_REQUIREMENTS, PROFILE_CONFIGS, PROFILE_META } from "./types";
import { estimateCost, getRequiredProviders } from "./helpers";

/* ── Provider Status Pages ── */
const PROVIDER_STATUS: Record<string, { pageUrl: string; apiUrl?: string }> = {
  google:    { pageUrl: "https://status.cloud.google.com/" },
  openai:    { pageUrl: "https://status.openai.com/",    apiUrl: "https://status.openai.com/api/v2/status.json" },
  anthropic: { pageUrl: "https://status.anthropic.com/",  apiUrl: "https://status.anthropic.com/api/v2/status.json" },
  replicate: { pageUrl: "https://status.replicate.com/",  apiUrl: "https://status.replicate.com/api/v2/status.json" },
};

function StatusIndicator({ providerId, statuses }: { providerId: string; statuses: Record<string, string> }) {
  const cfg = PROVIDER_STATUS[providerId];
  if (!cfg) return null;

  const status = statuses[providerId];
  const dotColor =
    status === "none"      ? "bg-green-500" :
    status === "minor"     ? "bg-yellow-500" :
    status === "major" || status === "critical" ? "bg-red-500" :
    null;
  const label =
    status === "none"      ? "Operacional" :
    status === "minor"     ? "Degradado" :
    status === "major"     ? "Instável" :
    status === "critical"  ? "Fora do ar" :
    "Status";

  return (
    <a
      href={cfg.pageUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export default function TabProviders() {
  const { session } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userKeys, setUserKeys] = useState<UserKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [activeProfile, setActiveProfile] = useState<ProfileId | null>(null);
  const [customConfig, setCustomConfig] = useState<Record<AIFunction, FunctionConfig> | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [expandedCustom, setExpandedCustom] = useState(false);
  const [providerStatuses, setProviderStatuses] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data: provData } = await supabase
        .from("ai_providers")
        .select("*")
        .order("name");
      setProviders(provData || []);

      const { data: keyData, error: keyError } = await supabase.functions.invoke(
        "manage-api-keys",
        { method: "GET" }
      );
      if (!keyError && keyData?.keys) {
        setUserKeys(keyData.keys);
      }

      const { data: modelData } = await supabase
        .from("ai_models")
        .select("*")
        .eq("status", "active");
      setModels(modelData || []);

      const { data: configData } = await supabase
        .from("user_ai_config")
        .select("function_name, provider_id, model_id, temperature");

      if (configData && configData.length > 0) {
        const configMap: Record<string, FunctionConfig> = {};
        for (const row of configData) {
          configMap[row.function_name] = {
            provider_id: row.provider_id,
            model_id: row.model_id,
            temperature: Number(row.temperature),
          };
        }

        let matched: ProfileId | null = null;
        for (const [profileId, profileConfig] of Object.entries(PROFILE_CONFIGS)) {
          const isMatch = AI_FUNCTIONS.every((fn) => {
            const saved = configMap[fn];
            const preset = profileConfig[fn];
            return saved && saved.provider_id === preset.provider_id && saved.model_id === preset.model_id;
          });
          if (isMatch) {
            matched = profileId as ProfileId;
            break;
          }
        }

        if (matched) {
          setActiveProfile(matched);
        } else if (AI_FUNCTIONS.every((fn) => configMap[fn])) {
          setActiveProfile("personalizado");
          setCustomConfig(configMap as Record<AIFunction, FunctionConfig>);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    Object.entries(PROVIDER_STATUS).forEach(([id, cfg]) => {
      if (!cfg.apiUrl) return;
      fetch(cfg.apiUrl)
        .then((r) => r.json())
        .then((d) => setProviderStatuses((prev) => ({ ...prev, [id]: d.status?.indicator ?? "unknown" })))
        .catch(() => setProviderStatuses((prev) => ({ ...prev, [id]: "unknown" })));
    });
  }, []);

  const handleValidateAndSave = async (providerId: string) => {
    const keyValue = (keyInputs[providerId] ?? "").trim();
    if (!keyValue) return;

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

  const handleSelectProfile = async (profileId: ProfileId) => {
    if (profileId === "personalizado") {
      setExpandedCustom(true);
      if (!customConfig) {
        const base = activeProfile && activeProfile !== "personalizado"
          ? PROFILE_CONFIGS[activeProfile]
          : PROFILE_CONFIGS.equilibrado;
        setCustomConfig({ ...base });
      }
      setActiveProfile("personalizado");
      return;
    }

    const config = PROFILE_CONFIGS[profileId];
    const requiredProviders = getRequiredProviders(config);
    const missingProviders = requiredProviders.filter(
      (pid) => !userKeys.some((k) => k.provider_id === pid)
    );

    if (missingProviders.length > 0) {
      toast({
        title: "Chaves de API necessárias",
        description: `Configure as chaves: ${missingProviders.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSavingProfile(true);
    try {
      for (const fn of AI_FUNCTIONS) {
        const c = config[fn];
        const { error } = await supabase
          .from("user_ai_config")
          .upsert(
            {
              user_id: session!.user.id,
              function_name: fn,
              provider_id: c.provider_id,
              model_id: c.model_id,
              temperature: c.temperature,
            },
            { onConflict: "user_id,function_name" }
          );
        if (error) throw error;
      }
      setActiveProfile(profileId);
      setExpandedCustom(false);
      toast({ title: `Perfil "${PROFILE_META[profileId].name}" ativado!` });
    } catch (err) {
      toast({
        title: "Erro ao salvar perfil",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCustomProfile = async () => {
    if (!customConfig) return;

    const requiredProviders = getRequiredProviders(customConfig);
    const missingProviders = requiredProviders.filter(
      (pid) => !userKeys.some((k) => k.provider_id === pid)
    );

    if (missingProviders.length > 0) {
      toast({
        title: "Chaves de API necessárias",
        description: `Configure as chaves: ${missingProviders.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSavingProfile(true);
    try {
      for (const fn of AI_FUNCTIONS) {
        const c = customConfig[fn];
        const { error } = await supabase
          .from("user_ai_config")
          .upsert(
            {
              user_id: session!.user.id,
              function_name: fn,
              provider_id: c.provider_id,
              model_id: c.model_id,
              temperature: c.temperature,
            },
            { onConflict: "user_id,function_name" }
          );
        if (error) throw error;
      }
      setActiveProfile("personalizado");
      toast({ title: "Perfil personalizado salvo!" });
    } catch (err) {
      toast({
        title: "Erro ao salvar perfil",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
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
                    <div className="flex items-center gap-3">
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
                      <StatusIndicator providerId={provider.id} statuses={providerStatuses} />
                    </div>
                  </div>
                </div>

                {existingKey && !isEditing && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-success">
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

      {/* ── AI Profiles ── */}
      <div className="mt-10 space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Perfis de IA</h3>
          <p className="text-sm text-muted-foreground">
            Selecione um perfil para configurar quais modelos serão usados em cada etapa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(PROFILE_META) as ProfileId[]).map((profileId) => {
            const meta = PROFILE_META[profileId];
            const Icon = meta.icon;
            const isActive = activeProfile === profileId;
            const isPreset = profileId !== "personalizado";
            const config = isPreset ? PROFILE_CONFIGS[profileId] : null;
            const cost = config ? estimateCost(config, models) : null;
            const requiredProviders = config ? getRequiredProviders(config) : [];
            const missingKeys = requiredProviders.filter(
              (pid) => !userKeys.some((k) => k.provider_id === pid)
            );
            const isDisabled = isPreset && missingKeys.length > 0;

            return (
              <button
                key={profileId}
                onClick={() => !isDisabled && !savingProfile && handleSelectProfile(profileId)}
                disabled={isDisabled || savingProfile}
                className={`relative text-left p-5 rounded-lg border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : isDisabled
                    ? "border-muted bg-muted/30 opacity-60 cursor-not-allowed"
                    : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                }`}
              >
                {isActive && (
                  <span className="absolute top-3 right-3">
                    <Check className="w-4 h-4 text-primary" />
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{meta.name}</p>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                </div>
                {cost && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Custo estimado: <span className="font-medium text-foreground">{cost}</span> /produto
                  </p>
                )}
                {isDisabled && (
                  <p className="text-xs text-destructive mt-2">
                    Requer: {missingKeys.join(", ")}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {activeProfile && activeProfile !== "personalizado" && (
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2.5 font-medium">Função</th>
                  <th className="text-left px-4 py-2.5 font-medium">Modelo</th>
                </tr>
              </thead>
              <tbody>
                {AI_FUNCTIONS.map((fn) => {
                  const c = PROFILE_CONFIGS[activeProfile][fn];
                  const model = models.find((m) => m.id === c.model_id);
                  return (
                    <tr key={fn} className="border-b last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground">{FUNCTION_LABELS[fn]}</td>
                      <td className="px-4 py-2.5">{model?.display_name || c.model_id}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeProfile === "personalizado" && (
          <div className="space-y-4">
            <button
              onClick={() => setExpandedCustom(!expandedCustom)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedCustom ? "rotate-180" : ""}`} />
              {expandedCustom ? "Ocultar configurações" : "Editar configurações"}
            </button>

            {expandedCustom && customConfig && (
              <div className="bg-card border rounded-lg p-5 space-y-4">
                {AI_FUNCTIONS.map((fn) => {
                  const currentConfig = customConfig[fn];
                  const requirements = FUNCTION_REQUIREMENTS[fn];
                  const compatibleModels = models.filter((m) =>
                    requirements.every((req) => m.capabilities.includes(req)) &&
                    userKeys.some((k) => k.provider_id === m.provider_id)
                  );

                  return (
                    <div key={fn} className="space-y-1.5">
                      <label className="text-sm font-medium">{FUNCTION_LABELS[fn]}</label>
                      <select
                        value={currentConfig.model_id}
                        onChange={(e) => {
                          const selectedModel = models.find((m) => m.id === e.target.value);
                          if (selectedModel) {
                            setCustomConfig((prev) => prev ? {
                              ...prev,
                              [fn]: {
                                ...prev[fn],
                                provider_id: selectedModel.provider_id,
                                model_id: selectedModel.id,
                              },
                            } : prev);
                          }
                        }}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {compatibleModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.display_name} ({providers.find((p) => p.id === m.provider_id)?.name || m.provider_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveCustomProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Salvando…
                      </>
                    ) : (
                      "Salvar perfil"
                    )}
                  </button>
                  {customConfig && estimateCost(customConfig, models) && (
                    <span className="text-xs text-muted-foreground">
                      Custo estimado: {estimateCost(customConfig, models)} /produto
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
