import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CreateListingProvider, useCreateListing } from "@/context/CreateListingContext";

// Helper component to access context
function TestConsumer({ onRender }: { onRender: (ctx: ReturnType<typeof useCreateListing>) => void }) {
  const ctx = useCreateListing();
  onRender(ctx);
  return <div data-testid="consumer">step:{ctx.currentStep}</div>;
}

describe("CreateListingContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default state", () => {
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    expect(ctx).not.toBeNull();
    expect(ctx!.currentStep).toBe(0);
    expect(ctx!.data.photos).toEqual([]);
    expect(ctx!.data.photoUrls).toEqual([]);
    expect(ctx!.data.prompts).toHaveLength(7);
    expect(ctx!.completedSteps).toEqual([false, false, false, false, false]);
  });

  it("goNext increments step", () => {
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    act(() => ctx!.goNext());
    expect(ctx!.currentStep).toBe(1);
  });

  it("goBack decrements step but not below 0", () => {
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    act(() => ctx!.goBack());
    expect(ctx!.currentStep).toBe(0);
  });

  it("completeStep marks step as done", () => {
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    act(() => ctx!.completeStep(2));
    expect(ctx!.completedSteps[2]).toBe(true);
    expect(ctx!.completedSteps[0]).toBe(false);
  });

  it("updateIdentification updates data", () => {
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    act(() => {
      ctx!.updateIdentification({
        name: "Test Product",
        category: "Electronics",
        characteristics: ["fast", "light"],
        extras: "none",
      });
    });
    expect(ctx!.data.identification.name).toBe("Test Product");
    expect(ctx!.data.identification.characteristics).toEqual(["fast", "light"]);
  });

  it("updateAds updates mercadoLivre and shopee data", () => {
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    act(() => {
      ctx!.updateAds({
        mercadoLivre: { title: "ML Title", description: "ML Desc" },
        shopee: { title: "Shopee Title", description: "Shopee Desc" },
      });
    });
    expect(ctx!.data.ads.mercadoLivre.title).toBe("ML Title");
    expect(ctx!.data.ads.shopee.title).toBe("Shopee Title");
  });

  it("updateOverlayUrl sets overlay for prompt", () => {
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    act(() => ctx!.updateOverlayUrl(3, "https://example.com/overlay.png"));
    expect(ctx!.data.overlayUrls[3]).toBe("https://example.com/overlay.png");
  });

  it("reset restores initial state and clears localStorage", () => {
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    act(() => {
      ctx!.goNext();
      ctx!.goNext();
      ctx!.updateIdentification({ name: "X", category: "Y", characteristics: [], extras: "" });
    });
    expect(ctx!.currentStep).toBe(2);
    act(() => ctx!.reset());
    expect(ctx!.currentStep).toBe(0);
    expect(ctx!.data.identification.name).toBe("");
    expect(localStorage.getItem("draft_listing_v1")).toBeNull();
  });

  it("auto-saves draft to localStorage after debounce", async () => {
    vi.useFakeTimers();
    let ctx: ReturnType<typeof useCreateListing> | null = null;
    render(
      <CreateListingProvider>
        <TestConsumer onRender={(c) => { ctx = c; }} />
      </CreateListingProvider>
    );
    act(() => {
      ctx!.updatePhotos([], ["https://example.com/photo.jpg"]);
      ctx!.updateIdentification({ name: "Draft Product", category: "Cat", characteristics: [], extras: "" });
    });
    // Advance past debounce
    act(() => { vi.advanceTimersByTime(3000); });
    const draft = localStorage.getItem("draft_listing_v1");
    expect(draft).not.toBeNull();
    const parsed = JSON.parse(draft!);
    expect(parsed.data.identification.name).toBe("Draft Product");
    expect(parsed.data.photoUrls).toEqual(["https://example.com/photo.jpg"]);
    vi.useRealTimers();
  });
});
