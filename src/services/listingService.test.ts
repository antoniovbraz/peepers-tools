import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveListing } from "./listingService";
import type { ListingData } from "@/context/CreateListingContext";

// --- Supabase mock ---
const mockProductInsert = vi.fn();
const mockAdsInsert = vi.fn();
const mockCreativesInsert = vi.fn();
const mockProductDelete = vi.fn();

function makeMockTable(name: "products" | "ads" | "creatives") {
  if (name === "products") {
    return {
      insert: mockProductInsert,
      delete: () => ({ eq: mockProductDelete }),
    };
  }
  if (name === "ads") return { insert: mockAdsInsert };
  return { insert: mockCreativesInsert };
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: "products" | "ads" | "creatives") => makeMockTable(table),
  },
}));

function makeListing(overrides: Partial<ListingData> = {}): ListingData {
  return {
    photos: [],
    photoUrls: ["https://cdn.example.com/p.jpg"],
    identification: {
      name: "Produto Teste",
      category: "Eletrônicos",
      suggested_category: "eletronicos",
      characteristics: ["feature1"],
      extras: "",
    },
    ads: {
      mercadoLivre: { title: "Título ML", description: "Desc ML" },
      shopee: { title: "Título Shopee", description: "Desc Shopee" },
    },
    prompts: [{ id: 1, prompt: "Studio white", approved: true, imageUrl: "https://cdn.example.com/img.jpg" }],
    overlayUrls: {},
    overlayElements: {},
    visualDNA: null,
    marketplace: "mercadoLivre",
    includeBrand: false,
    ...overrides,
  } as unknown as ListingData;
}

describe("listingService.saveListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all succeed
    mockProductInsert.mockReturnValue({
      select: () => ({ single: () => Promise.resolve({ data: { id: "prod-abc" }, error: null }) }),
    });
    mockAdsInsert.mockResolvedValue({ error: null });
    mockCreativesInsert.mockResolvedValue({ error: null });
  });

  it("returns the product ID on success", async () => {
    const id = await saveListing("user-1", makeListing());
    expect(id).toBe("prod-abc");
  });

  it("inserts product with correct fields", async () => {
    await saveListing("user-1", makeListing());
    expect(mockProductInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Produto Teste",
        user_id: "user-1",
        category: "Eletrônicos",
      }),
    );
  });

  it("inserts at least mercadoLivre and shopee ads", async () => {
    await saveListing("user-1", makeListing());
    expect(mockAdsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ marketplace: "mercado_livre" }),
        expect.objectContaining({ marketplace: "shopee" }),
      ]),
    );
  });

  it("deletes product and throws when ads insert fails", async () => {
    const adsErr = new Error("ads constraint violation");
    mockAdsInsert.mockResolvedValue({ error: adsErr });

    await expect(saveListing("user-1", makeListing())).rejects.toThrow("ads constraint violation");
    expect(mockProductDelete).toHaveBeenCalledWith("id", "prod-abc");
  });

  it("does NOT rollback product when creatives fail", async () => {
    mockCreativesInsert.mockResolvedValue({ error: new Error("DB glitch") });

    const id = await saveListing("user-1", makeListing());
    // Should still return the id (creatives are non-critical)
    expect(id).toBe("prod-abc");
    expect(mockProductDelete).not.toHaveBeenCalled();
  });

  it("includes amazon ad when present", async () => {
    const listing = makeListing({
      ads: {
        mercadoLivre: { title: "ML", description: "" },
        shopee: { title: "SP", description: "" },
        amazon: { title: "AMZ", description: "", bullets: ["b1"] },
      },
    } as Partial<ListingData>);

    await saveListing("user-1", listing);
    expect(mockAdsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ marketplace: "amazon" }),
      ]),
    );
  });
});
