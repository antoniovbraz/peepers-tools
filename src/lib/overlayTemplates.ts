import type { OverlayElement } from "@/components/create/overlay-editor/types";

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
          opacity: 100,
          textAlign: "left",
          textStyle: "none",
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
          bold: false,
          opacity: 100,
          textAlign: "left",
          textStyle: "none",
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
          bold: false,
          opacity: 100,
          textAlign: "left",
          textStyle: "none",
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
          bold: false,
          opacity: 100,
          textAlign: "left",
          textStyle: "none",
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
          opacity: 100,
          textAlign: "left",
          textStyle: "none",
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
          opacity: 100,
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
          opacity: 100,
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
          opacity: 100,
        },
      ];

    case 4: // Close-up
      return [
        {
          id: "circle-1",
          type: "circle",
          x: 50,
          y: 50,
          radius: 15,
          color: accentColor,
          strokeWidth: 3,
          opacity: 100,
        },
        {
          id: "arrow-1",
          type: "arrow",
          text: "Detalhe",
          x: 75,
          y: 30,
          fontSize: 14,
          color: headlineColor,
          length: 10,
          rotation: -30,
          opacity: 100,
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
          opacity: 100,
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
          opacity: 100,
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
          opacity: 100,
          textAlign: "left",
          textStyle: "none",
        },
      ];

    default:
      return [];
  }
}
