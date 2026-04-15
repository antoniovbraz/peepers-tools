import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepIdentify from "./StepIdentify";

// --- mock retryFetch ---
vi.mock("@/lib/retryFetch", () => ({
  invokeWithRetry: vi.fn(),
}));

const mockUpdateIdentification = vi.fn();
const mockCompleteStep = vi.fn();
const mockGoNext = vi.fn();
const mockGoBack = vi.fn();

const defaultData = {
  photoUrls: ["https://cdn.example.com/p1.jpg"],
  identification: {
    name: "",
    category: "",
    suggested_category: "",
    characteristics: [],
    extras: "",
    ean: "",
    originalSku: "",
    internalSku: "",
    skuMappingNote: "",
  },
};

vi.mock("@/context/CreateListingContext", () => ({
  useCreateListing: () => ({
    data: defaultData,
    updateIdentification: mockUpdateIdentification,
    completeStep: mockCompleteStep,
    goNext: mockGoNext,
    goBack: mockGoBack,
  }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({ useErrorHandler: () => vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/lib/knowledgeCategories", () => ({ CATEGORIES: [] }));

import { invokeWithRetry } from "@/lib/retryFetch";

const mockInvoke = vi.mocked(invokeWithRetry);

const aiResult = {
  name: "Copo Térmico",
  category: "Casa e Cozinha",
  suggested_category: "casa_cozinha",
  characteristics: ["500ml", "inox", "dupla parede"],
  ean: "1234567890123",
  original_sku: "CUP-001",
};

describe("StepIdentify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: aiResult, error: null });
  });

  it("auto-runs AI on mount when photos exist", async () => {
    render(<StepIdentify />);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "identify-product",
        expect.objectContaining({ photoUrls: ["https://cdn.example.com/p1.jpg"] }),
      );
    });
  });

  it("populates fields with AI result", async () => {
    render(<StepIdentify />);
    await waitFor(() => {
      expect(mockUpdateIdentification).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Copo Térmico",
          category: "Casa e Cozinha",
          suggested_category: "casa_cozinha",
        }),
      );
    });
  });

  it("shows product name in input after identification", async () => {
    render(<StepIdentify />);
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("Copo Térmico");
      expect(nameInput).toBeTruthy();
    });
  });

  it("re-runs AI when Identificar button clicked", async () => {
    render(<StepIdentify />);
    // Wait for auto-run to finish
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(1));

    const button = screen.getByRole("button", { name: /identificar|analisar/i });
    await userEvent.click(button);

    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(2));
  });
});
