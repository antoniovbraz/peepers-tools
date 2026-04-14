/**
 * Knowledge base assembler for marketplace listing prompts.
 * Composes relevant knowledge modules based on function, marketplace, and category.
 * Token budget: ~6000 tokens per call. Each module is ~400-800 tokens.
 */

import { MERCADO_LIVRE_RULES, SHOPEE_RULES, AMAZON_BR_RULES, MAGALU_RULES } from "./marketplace-rules.ts";
import { COPYWRITING_FRAMEWORK } from "./copywriting.ts";
import { getCategoryGuide, normalizeCategory, type KnowledgeCategory } from "./category-guides.ts";
import { SEO_STRATEGY } from "./seo-strategy.ts";
import { IMAGE_RULES, getImageRules } from "./image-rules.ts";
import { OVERLAY_COPY_RULES } from "./overlay-copy.ts";

export type { KnowledgeCategory };
export { normalizeCategory };

export type Marketplace = "mercadoLivre" | "shopee" | "amazon" | "magalu" | "all";

export interface BuildKnowledgeOptions {
  /** Which edge function is calling (determines which modules to include) */
  functionName: "ads" | "overlay_copy" | "prompts" | "identify";
  /** Target marketplace(s) */
  marketplace?: Marketplace;
  /** Product category (free text — will be normalized) */
  category?: string;
  /** If false (default), omit brand from title format instructions */
  includeBrand?: boolean;
}

function getMarketplaceRules(marketplace: Marketplace, includeBrand: boolean): string {
  const brandNote = includeBrand
    ? ""
    : "\n⚠️ REGRA DE NEGÓCIO: NÃO inclua marca/fabricante no título. Use o formato SEM MARCA indicado abaixo.\n";

  const rules: string[] = [brandNote];

  if (marketplace === "all" || marketplace === "mercadoLivre") rules.push(MERCADO_LIVRE_RULES);
  if (marketplace === "all" || marketplace === "shopee") rules.push(SHOPEE_RULES);
  if (marketplace === "all" || marketplace === "amazon") rules.push(AMAZON_BR_RULES);
  if (marketplace === "all" || marketplace === "magalu") rules.push(MAGALU_RULES);

  return rules.join("\n");
}

/**
 * Assemble the knowledge string to inject into an edge function system prompt.
 * Returns a string ready to be appended after LLM_SAFETY_INSTRUCTION.
 */
export function buildKnowledge(options: BuildKnowledgeOptions): string {
  const {
    functionName,
    marketplace = "all",
    category,
    includeBrand = false,
  } = options;

  const normalizedCategory = category ? normalizeCategory(category) : undefined;
  const sections: string[] = [];

  sections.push("═══════════════════════════════════════");
  sections.push("BASE DE CONHECIMENTO — MARKETPLACES BR");
  sections.push("═══════════════════════════════════════");

  if (functionName === "ads") {
    // Core: marketplace rules + copywriting + category guide + SEO
    sections.push(getMarketplaceRules(marketplace, includeBrand));
    sections.push(COPYWRITING_FRAMEWORK);
    if (normalizedCategory) {
      sections.push(getCategoryGuide(normalizedCategory));
    }
    sections.push(SEO_STRATEGY);
  }

  if (functionName === "overlay_copy") {
    // Core: overlay rules + category guide (for tone/style context)
    sections.push(OVERLAY_COPY_RULES);
    if (normalizedCategory) {
      sections.push(getCategoryGuide(normalizedCategory));
    }
  }

  if (functionName === "prompts") {
    // Core: image rules filtered by active marketplace
    sections.push(getImageRules(marketplace));
    if (normalizedCategory) {
      sections.push(getCategoryGuide(normalizedCategory));
    }
  }

  if (functionName === "identify") {
    // Minimal — just category guide to help map to correct category
    if (normalizedCategory) {
      sections.push(getCategoryGuide(normalizedCategory));
    }
  }

  sections.push("═══════════════════════════════════════");
  return sections.join("\n\n");
}

/** Category list for display and validation in the frontend */
export const CATEGORIES: { key: KnowledgeCategory; label: string }[] = [
  { key: "acessorios_celular", label: "Acessórios para Celular" },
  { key: "eletronicos", label: "Eletrônicos / Informática" },
  { key: "moda", label: "Moda (Roupas, Calçados, Bolsas)" },
  { key: "casa_cozinha", label: "Casa e Cozinha" },
  { key: "beleza", label: "Beleza e Cuidados Pessoais" },
  { key: "papelaria", label: "Papelaria e Escritório" },
  { key: "brinquedos", label: "Brinquedos e Jogos" },
  { key: "esportes", label: "Esportes e Fitness" },
  { key: "automotivo", label: "Automotivo" },
  { key: "saude", label: "Saúde e Suplementos" },
];
