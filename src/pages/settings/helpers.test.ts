import { describe, it, expect } from "vitest";
import { estimateCost, getRequiredProviders } from "./helpers";
import type { AIModel, AIFunction, FunctionConfig } from "./types";

const makeConfig = (overrides?: Partial<Record<AIFunction, FunctionConfig>>): Record<AIFunction, FunctionConfig> => ({
  identify:     { provider_id: "google",    model_id: "gemini-flash",  temperature: 0.3 },
  ads:          { provider_id: "anthropic", model_id: "claude-haiku",  temperature: 0.7 },
  prompts:      { provider_id: "google",    model_id: "gemini-flash",  temperature: 0.7 },
  image:        { provider_id: "replicate", model_id: "flux-schnell",  temperature: 0.9 },
  overlay_copy: { provider_id: "google",    model_id: "gemini-flash",  temperature: 0.7 },
  ...overrides,
});

const makeModel = (id: string, overrides?: Partial<AIModel>): AIModel => ({
  id,
  provider_id: "google",
  display_name: id,
  capabilities: [],
  recommended_for: [],
  cost_per_1k_input: 0.001,
  cost_per_1k_output: 0.002,
  cost_per_image: null,
  ...overrides,
});

describe("estimateCost", () => {
  it("returns null when a model is not found", () => {
    const config = makeConfig();
    const models: AIModel[] = []; // no models
    expect(estimateCost(config, models)).toBeNull();
  });

  it("returns null when total is zero", () => {
    const config = makeConfig();
    const models = [
      makeModel("gemini-flash", { cost_per_1k_input: 0, cost_per_1k_output: 0 }),
      makeModel("claude-haiku", { provider_id: "anthropic", cost_per_1k_input: 0, cost_per_1k_output: 0 }),
      makeModel("flux-schnell", { provider_id: "replicate", cost_per_image: 0 }),
    ];
    expect(estimateCost(config, models)).toBeNull();
  });

  it("returns cents format for small costs", () => {
    const config = makeConfig();
    const models = [
      makeModel("gemini-flash", { cost_per_1k_input: 0.0001, cost_per_1k_output: 0.0002 }),
      makeModel("claude-haiku", { provider_id: "anthropic", cost_per_1k_input: 0.0001, cost_per_1k_output: 0.0002 }),
      makeModel("flux-schnell", { provider_id: "replicate", cost_per_image: 0.001 }),
    ];
    const result = estimateCost(config, models);
    expect(result).not.toBeNull();
    expect(result!).toMatch(/^~\d+\.\d¢$/);
  });

  it("returns dollar format for larger costs", () => {
    const config = makeConfig();
    const models = [
      makeModel("gemini-flash", { cost_per_1k_input: 0.01, cost_per_1k_output: 0.03 }),
      makeModel("claude-haiku", { provider_id: "anthropic", cost_per_1k_input: 0.01, cost_per_1k_output: 0.03 }),
      makeModel("flux-schnell", { provider_id: "replicate", cost_per_image: 0.05 }),
    ];
    const result = estimateCost(config, models);
    expect(result).not.toBeNull();
    expect(result!).toMatch(/^~\$\d+\.\d{2}$/);
  });

  it("multiplies image cost by 7", () => {
    // Only image model has cost, rest zero
    const config = makeConfig();
    const models = [
      makeModel("gemini-flash", { cost_per_1k_input: 0, cost_per_1k_output: 0 }),
      makeModel("claude-haiku", { provider_id: "anthropic", cost_per_1k_input: 0, cost_per_1k_output: 0 }),
      makeModel("flux-schnell", { provider_id: "replicate", cost_per_image: 0.10, cost_per_1k_input: null, cost_per_1k_output: null }),
    ];
    const result = estimateCost(config, models);
    expect(result).toBe("~$0.70");
  });
});

describe("getRequiredProviders", () => {
  it("returns unique providers from config", () => {
    const config = makeConfig();
    const providers = getRequiredProviders(config);
    expect(providers).toHaveLength(3);
    expect(providers).toContain("google");
    expect(providers).toContain("anthropic");
    expect(providers).toContain("replicate");
  });

  it("returns single provider when all same", () => {
    const config = makeConfig({
      identify:     { provider_id: "google", model_id: "g", temperature: 0.3 },
      ads:          { provider_id: "google", model_id: "g", temperature: 0.7 },
      prompts:      { provider_id: "google", model_id: "g", temperature: 0.7 },
      image:        { provider_id: "google", model_id: "g", temperature: 0.9 },
      overlay_copy: { provider_id: "google", model_id: "g", temperature: 0.7 },
    });
    const providers = getRequiredProviders(config);
    expect(providers).toEqual(["google"]);
  });
});
