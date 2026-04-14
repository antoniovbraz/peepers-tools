import type { AIFunction, AIModel, FunctionConfig } from "./types";
import { AI_FUNCTIONS } from "./types";

export function estimateCost(config: Record<AIFunction, FunctionConfig>, models: AIModel[]): string | null {
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

export function getRequiredProviders(config: Record<AIFunction, FunctionConfig>): string[] {
  return [...new Set(AI_FUNCTIONS.map((fn) => config[fn].provider_id))];
}
