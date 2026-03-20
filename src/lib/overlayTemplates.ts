export interface OverlayElement {
  id: string;
  type: "headline" | "subheadline" | "bullet" | "badge" | "arrow" | "circle";
  text?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width?: number; // percentage 0-100
  fontSize?: number; // px
  color?: string;
  bgColor?: string;
  bold?: boolean;
  rotation?: number; // degrees
  icon?: string; // lucide icon name
  opacity?: number; // 0-100, default 100
  textAlign?: "left" | "center" | "right"; // default left
  textStyle?: "none" | "shadow" | "stroke"; // default none
}

export interface OverlayTemplate {
  id: number;
  role: string;
  label: string;
  description: string;
  elements: OverlayElement[];
}

export const IMAGE_ROLES = [
  { id: 1, role: "cover", label: "Cover", description: "Imagem principal — sem overlay" },
  { id: 2, role: "benefits", label: "Benefícios", description: "Headline + bullets à esquerda" },
  { id: 3, role: "features", label: "Features", description: "Ícones + labels ao redor" },
  { id: 4, role: "closeup", label: "Close-up", description: "Círculos de zoom + setas" },
  { id: 5, role: "lifestyle", label: "Lifestyle", description: "Badge de texto discreto" },
  { id: 6, role: "portability", label: "Portabilidade", description: "Indicador de escala" },
  { id: 7, role: "inbox", label: "Conteúdo", description: "Labels nos itens inclusos" },
] as const;

export function getDefaultTemplate(imageIndex: number, headlineColor: string, accentColor: string): OverlayElement[] {
  switch (imageIndex) {
    case 1: // Cover — no overlay
      return [];

    case 2: // Benefits
      return [
        {
          id: "headline-1",
          type: "headline",
          text: "Título do Benefício",
          x: 5,
          y: 15,
          width: 40,
          fontSize: 28,
          color: headlineColor,
          bold: true,
        },
        {
          id: "bullet-1",
          type: "bullet",
          text: "✓ Benefício principal",
          x: 5,
          y: 35,
          width: 40,
          fontSize: 16,
          color: headlineColor,
        },
        {
          id: "bullet-2",
          type: "bullet",
          text: "✓ Segundo benefício",
          x: 5,
          y: 45,
          width: 40,
          fontSize: 16,
          color: headlineColor,
        },
        {
          id: "bullet-3",
          type: "bullet",
          text: "✓ Terceiro benefício",
          x: 5,
          y: 55,
          width: 40,
          fontSize: 16,
          color: headlineColor,
        },
      ];

    case 3: // Features
      return [
        {
          id: "headline-features",
          type: "headline",
          text: "Características",
          x: 5,
          y: 5,
          width: 90,
          fontSize: 24,
          color: headlineColor,
          bold: true,
        },
        {
          id: "badge-1",
          type: "badge",
          text: "Feature 1",
          x: 5,
          y: 75,
          fontSize: 14,
          color: "#FFFFFF",
          bgColor: accentColor,
        },
        {
          id: "badge-2",
          type: "badge",
          text: "Feature 2",
          x: 35,
          y: 75,
          fontSize: 14,
          color: "#FFFFFF",
          bgColor: accentColor,
        },
        {
          id: "badge-3",
          type: "badge",
          text: "Feature 3",
          x: 65,
          y: 75,
          fontSize: 14,
          color: "#FFFFFF",
          bgColor: accentColor,
        },
      ];

    case 4: // Close-up
      return [
        {
          id: "circle-1",
          type: "circle",
          x: 50,
          y: 50,
          width: 30,
          color: accentColor,
        },
        {
          id: "arrow-1",
          type: "arrow",
          text: "Detalhe",
          x: 75,
          y: 30,
          fontSize: 14,
          color: headlineColor,
          rotation: -30,
        },
      ];

    case 5: // Lifestyle
      return [
        {
          id: "badge-lifestyle",
          type: "badge",
          text: "Ideal para o dia a dia",
          x: 5,
          y: 85,
          fontSize: 16,
          color: "#FFFFFF",
          bgColor: headlineColor,
        },
      ];

    case 6: // Portability
      return [
        {
          id: "badge-scale",
          type: "badge",
          text: "Tamanho compacto",
          x: 5,
          y: 85,
          fontSize: 16,
          color: "#FFFFFF",
          bgColor: accentColor,
        },
      ];

    case 7: // In-box
      return [
        {
          id: "headline-inbox",
          type: "headline",
          text: "O que vem na caixa",
          x: 5,
          y: 5,
          width: 90,
          fontSize: 24,
          color: headlineColor,
          bold: true,
        },
      ];

    default:
      return [];
  }
}
