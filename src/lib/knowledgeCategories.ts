/**
 * Category list mirror for frontend use.
 * Mirrors the categories defined in the knowledge base (edge functions).
 */

export type KnowledgeCategory =
  | "eletronicos"
  | "moda"
  | "casa_cozinha"
  | "beleza"
  | "papelaria"
  | "brinquedos"
  | "acessorios_celular"
  | "esportes"
  | "automotivo"
  | "saude";

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
