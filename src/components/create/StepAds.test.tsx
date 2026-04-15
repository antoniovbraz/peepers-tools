import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepAds from "./StepAds";

vi.mock("@/lib/retryFetch", () => ({
  invokeWithRetry: vi.fn(),
}));

const mockUpdateAds = vi.fn();
const mockUpdateIncludeBrand = vi.fn();
const mockCompleteStep = vi.fn();
const mockGoNext = vi.fn();
const mockGoBack = vi.fn();

const defaultData = {
  identification: {
    name: "Fone Bluetooth",
    category: "Eletrônicos",
    suggested_category: "eletronicos",
    characteristics: ["sem fio", "40h bateria"],
    extras: "",
  },
  ads: {
    mercadoLivre: { title: "", description: "" },
    shopee: { title: "", description: "" },
    amazon: { title: "", description: "", bullets: [] },
    magalu: { title: "", description: "" },
  },
  includeBrand: false,
  marketplace: "mercadoLivre",
};

vi.mock("@/context/CreateListingContext", () => ({
  useCreateListing: () => ({
    data: defaultData,
    updateAds: mockUpdateAds,
    updateIncludeBrand: mockUpdateIncludeBrand,
    completeStep: mockCompleteStep,
    goNext: mockGoNext,
    goBack: mockGoBack,
  }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({ useErrorHandler: () => vi.fn() }));

import { invokeWithRetry } from "@/lib/retryFetch";

const mockInvoke = vi.mocked(invokeWithRetry);

const adsResult = {
  mercadoLivre: { title: "Fone Bluetooth Sem Fio 40h", description: "Descrição ML" },
  shopee: { title: "Fone BT 40h 🎧", description: "Descrição Shopee" },
  amazon: { title: "Bluetooth Headphones 40h", description: "Amazon desc", bullets: ["40h battery"] },
  magalu: { title: "Fone Bluetooth 40h", description: "Descrição Magalu" },
};

describe("StepAds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: adsResult, error: null });
  });

  it("auto-generates ads on mount when name exists", async () => {
    render(<StepAds />);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "generate-ads",
        expect.objectContaining({ productName: "Fone Bluetooth", marketplace: "all" }),
      );
    });
  });

  it("passes includeBrand to edge function", async () => {
    render(<StepAds />);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "generate-ads",
        expect.objectContaining({ includeBrand: false }),
      );
    });
  });

  it("calls updateAds with all four marketplaces", async () => {
    render(<StepAds />);
    await waitFor(() => {
      expect(mockUpdateAds).toHaveBeenCalledWith(
        expect.objectContaining({
          mercadoLivre: adsResult.mercadoLivre,
          shopee: adsResult.shopee,
          amazon: adsResult.amazon,
          magalu: adsResult.magalu,
        }),
      );
    });
  });

  it("re-generates when Gerar button is clicked", async () => {
    render(<StepAds />);
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(1));

    const btn = screen.getByRole("button", { name: /gerar|regenerar/i });
    await userEvent.click(btn);

    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(2));
  });
});
