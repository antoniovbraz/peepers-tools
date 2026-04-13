import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Check, X, Loader2, Trash2, User, Cpu, BarChart3, ExternalLink, Zap, Scale, Crown, Sliders, ChevronDown } from "lucide-react";

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

interface AIModel {
  id: string;
  provider_id: string;
  display_name: string;
  capabilities: string[];
  recommended_for: string[];
  cost_per_1k_input: number | null;
  cost_per_1k_output: number | null;
  cost_per_image: number | null;
}

interface FunctionConfig {
  provider_id: string;
  model_id: string;
  temperature: number;
}

type ProfileId = "economico" | "equilibrado" | "premium" | "personalizado";

const AI_FUNCTIONS = ["identify", "ads", "prompts", "image", "overlay_copy"] as const;
type AIFunction = typeof AI_FUNCTIONS[number];

const FUNCTION_LABELS: Record<AIFunction, string> = {
  identify: "Identificar Produto",
  ads: "Gerar Anúncios",
  prompts: "Gerar Prompts",
  image: "Gerar Imagem",
  overlay_copy: "Gerar Copy Overlay",
};

const FUNCTION_REQUIREMENTS: Record<AIFunction, string[]> = {
  identify: ["vision", "function_calling"],
  ads: ["text", "function_calling"],
  prompts: ["text", "function_calling"],
  image: ["image_gen"],
  overlay_copy: ["text", "function_calling"],
};

const PROFILE_CONFIGS: Record<Exclude<ProfileId, "personalizado">, Record<AIFunction, FunctionConfig>> = {
  economico: {
    identify:     { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.3 },
    ads:          { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.7 },
    prompts:      { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.7 },
    image:        { provider_id: "replicate", model_id: "flux-schnell", temperature: 0.9 },
    overlay_copy: { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.7 },
  },
  equilibrado: {
    identify:     { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.3 },
    ads:          { provider_id: "anthropic", model_id: "claude-haiku-3.5", temperature: 0.7 },
    prompts:      { provider_id: "google",    model_id: "gemini-2.5-flash", temperature: 0.7 },
    image:        { provider_id: "google",    model_id: "gemini-2.0-flash-preview-image-generation", temperature: 0.9 },
    overlay_copy: { provider_id: "anthropic", model_id: "claude-haiku-3.5", temperature: 0.7 },
  },
  premium: {
    identify:     { provider_id: "openai",    model_id: "gpt-4o", temperature: 0.3 },
    ads:          { provider_id: "anthropic", model_id: "claude-sonnet-4-20250514", temperature: 0.7 },
    prompts:      { provider_id: "anthropic", model_id: "claude-sonnet-4-20250514", temperature: 0.7 },
    image:        { provider_id: "openai",    model_id: "dall-e-3", temperature: 0.9 },
    overlay_copy: { provider_id: "anthropic", model_id: "claude-sonnet-4-20250514", temperature: 0.7 },
  },
};

const PROFILE_META: Record<ProfileId, { name: string; description: string; icon: React.ElementType }> = {
  economico:     { name: "Econômico",     description: "Menor custo por produto",   icon: Zap },
  equilibrado:   { name: "Equilibrado",   description: "Melhor custo-benefício",    icon: Scale },
  premium:       { name: "Premium",       description: "Máxima qualidade",          icon: Crown },
  personalizado: { name: "Personalizado", description: "Escolha manual por função", icon: Sliders },
};

function estimateCost(config: Record<AIFunction, FunctionConfig>, models: AIModel[]): string | null {
  let total = 0;
  const modelMap = new Map(models.map((m) => [m.id, m]));

  for (const fn of AI_FUNCTIONS) {
    const c = config[fn];
    const model = modelMap.get(c.model_id);
    if (!model) return null;

    if (fn === "image") {
      total += (model.cost_per_image ?? 0) * 7;
    } else {
      total += (model.cost_per_1k_input ?? 0) * 2 + (model.cost_per_1k_output ?? 0) * 1;
    }
  }

  if (total === 0) return null;
  return total < 0.01
    ? `~${(total * 100).toFixed(1)}¢`
    : `~$${total.toFixed(2)}`;
}

function getRequiredProviders(config: Record<AIFunction, FunctionConfig>): string[] {
  return [...new Set(AI_FUNCTIONS.map((fn) => config[fn].provider_id))];
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
  const [models, setModels] = useState<AIModel[]>([]);
  const [activeProfile, setActiveProfile] = useState<ProfileId | null>(null);
  const [customConfig, setCustomConfig] = useState<Record<AIFunction, FunctionConfig> | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [expandedCustom, setExpandedCustom] = useState(false);

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

      // Load models
      const { data: modelData } = await supabase
        .from("ai_models")
        .select("*")
        .eq("status", "active");
      setModels(modelData || []);

      // Load current AI config to detect active profile
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

        {/* Active profile details */}
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

        {/* Custom profile editor */}
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
