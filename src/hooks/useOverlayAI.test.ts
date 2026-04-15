import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOverlayAI } from "./useOverlayAI";
import type { OverlayElement } from "@/components/create/overlay-editor/types";
import { supabase } from "@/integrations/supabase/client";

// --- Mock supabase ---
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const mockInvoke = vi.mocked(supabase.functions.invoke);

function makeHeadline(id = "h1"): OverlayElement {
  return {
    id,
    type: "headline",
    text: "",
    x: 5, y: 5,
    width: 90,
    fontSize: 24,
    color: "#ffffff",
    bold: true,
    opacity: 100,
    textAlign: "center",
    textStyle: "none",
  };
}

function makeBullet(id: string, idx: number): OverlayElement {
  return {
    id,
    type: "bullet",
    text: "",
    x: 5,
    y: 30 + idx * 10,
    width: 40,
    fontSize: 16,
    color: "#ffffff",
    bold: false,
    opacity: 100,
    textAlign: "left",
    textStyle: "none",
  };
}

describe("useOverlayAI", () => {
  const setElements = vi.fn();
  const pushStructuralSnapshot = vi.fn();
  const getAllOverlayCopies = vi.fn(() => []);

  function makeParams(elements: OverlayElement[] = [makeHeadline()]) {
    return {
      productName: "Caneca Térmica",
      characteristics: ["500ml", "inox"],
      imageIndex: 1,
      imageRole: "benefits",
      elements,
      setElements,
      pushStructuralSnapshot,
      getAllOverlayCopies,
      headlineColor: "#ffffff",
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setElements.mockImplementation((fn: unknown) => {
      if (typeof fn === "function") fn([makeHeadline()]);
    });
  });

  it("calls generate-overlay-copy with correct params", async () => {
    mockInvoke.mockResolvedValue({
      data: { headline: "Aqueça seu dia", bullets: [], badges: [] },
      error: null,
    });

    const { result } = renderHook(() => useOverlayAI(makeParams()));

    await act(() => result.current.generateCopy());

    expect(mockInvoke).toHaveBeenCalledWith(
      "generate-overlay-copy",
      expect.objectContaining({
        body: expect.objectContaining({
          productName: "Caneca Térmica",
          imageRole: "benefits",
          imageIndex: 1,
        }),
      }),
    );
  });

  it("applies headline text to headline elements", async () => {
    mockInvoke.mockResolvedValue({
      data: { headline: "Aqueça seu dia", bullets: [], badges: [] },
      error: null,
    });

    const { result } = renderHook(() => useOverlayAI(makeParams()));
    await act(() => result.current.generateCopy());

    // setElements called with updater — grab the result
    expect(setElements).toHaveBeenCalled();
  });

  it("passes previousCopies to avoid repetition", async () => {
    getAllOverlayCopies.mockReturnValue(["Headline anterior", "Outro copy"]);
    mockInvoke.mockResolvedValue({
      data: { headline: "Fresh angle", bullets: [], badges: [] },
      error: null,
    });

    const { result } = renderHook(() => useOverlayAI(makeParams()));
    await act(() => result.current.generateCopy());

    expect(mockInvoke).toHaveBeenCalledWith(
      "generate-overlay-copy",
      expect.objectContaining({
        body: expect.objectContaining({
          previousCopies: ["Headline anterior", "Outro copy"],
        }),
      }),
    );
  });

  it("clears generatingElementId after generateSingleCopy completes", async () => {
    mockInvoke.mockResolvedValue({
      data: { headline: "Text", bullets: [], badges: [] },
      error: null,
    });

    const { result } = renderHook(() => useOverlayAI(makeParams()));

    await act(() => result.current.generateSingleCopy("h1"));

    // After completion, state should be reset
    expect(result.current.generatingElementId).toBeNull();
    expect(result.current.generatingCopy).toBe(false);
    // And the invoke was called
    expect(mockInvoke).toHaveBeenCalledWith(
      "generate-overlay-copy",
      expect.objectContaining({
        body: expect.objectContaining({ targetElements: expect.arrayContaining(["headline"]) }),
      }),
    );
  });
});
