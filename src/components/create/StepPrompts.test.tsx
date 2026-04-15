import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepPrompts from "./StepPrompts";

// --- Mock retryFetch ---
vi.mock("@/lib/retryFetch", () => ({
  invokeWithRetry: vi.fn(),
}));

// --- Mock context ---
const mockUpdatePrompts = vi.fn();
const mockUpdateVisualDNA = vi.fn();
const mockCompleteStep = vi.fn();
const mockGoNext = vi.fn();
const mockGoBack = vi.fn();

const baseData = {
  photoUrls: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  identification: {
    name: "Caneta Azul",
    category: "Papelaria",
    suggested_category: "papelaria",
    characteristics: ["tinta azul", "ponta fina"],
    extras: "",
  },
  ads: { mercadoLivre: { title: "Caneta Azul", description: "" }, shopee: { title: "", description: "" } },
  marketplace: "mercadoLivre",
  prompts: [
    { id: 1, prompt: "", approved: false },
    { id: 2, prompt: "", approved: false },
    { id: 3, prompt: "", approved: false },
  ],
  overlayUrls: {},
  overlayElements: {},
  visualDNA: null,
};

vi.mock("@/context/CreateListingContext", () => ({
  useCreateListing: () => ({
    data: baseData,
    updatePrompts: mockUpdatePrompts,
    updateVisualDNA: mockUpdateVisualDNA,
    updateOverlayUrl: vi.fn(),
    completeStep: mockCompleteStep,
    goNext: mockGoNext,
    goBack: mockGoBack,
  }),
  PromptCard: undefined,
}));

vi.mock("@/hooks/useErrorHandler", () => ({ useErrorHandler: () => vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("./PromptCardItem", () => ({
  default: ({ prompt }: { prompt: { id: number; prompt: string } }) => (
    <div data-testid={`card-${prompt.id}`}>{prompt.prompt}</div>
  ),
}));

import { invokeWithRetry } from "@/lib/retryFetch";

const mockInvoke = vi.mocked(invokeWithRetry);

describe("StepPrompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({
      data: {
        prompts: [
          "Studio white background, blue pen",
          "Close-up nib detail",
          "Pen on notebook lifestyle",
          "Portability in hand",
          "Ink flow detail",
          "Package contents",
          "Benefits overlay",
        ],
        visualDNA: { productAppearance: "blue ballpoint pen" },
      },
      error: null,
    });
  });

  it("calls generate-prompts with referencePhotos on mount", async () => {
    render(<StepPrompts />);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "generate-prompts",
        expect.objectContaining({
          referencePhotos: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
        }),
      );
    });
  });

  it("passes product metadata to generate-prompts", async () => {
    render(<StepPrompts />);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "generate-prompts",
        expect.objectContaining({
          productName: "Caneta Azul",
          category: "Papelaria",
          suggested_category: "papelaria",
        }),
      );
    });
  });

  it("calls updateVisualDNA when visualDNA is returned", async () => {
    render(<StepPrompts />);

    await waitFor(() => {
      expect(mockUpdateVisualDNA).toHaveBeenCalledWith({ productAppearance: "blue ballpoint pen" });
    });
  });

  it("calls updatePrompts with generated prompts", async () => {
    render(<StepPrompts />);

    await waitFor(() => {
      expect(mockUpdatePrompts).toHaveBeenCalled();
      const prompts = mockUpdatePrompts.mock.calls[0][0];
      expect(prompts[0].prompt).toBe("Studio white background, blue pen");
    });
  });
});
