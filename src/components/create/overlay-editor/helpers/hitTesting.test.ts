import { describe, it, expect, vi, beforeEach } from "vitest";
import { getElementBounds, getElementSizePercent, hitTest, hitTestResizeHandle } from "./hitTesting";
import { clearTextCache } from "./textMeasure";
import type { HeadlineElement, CircleElement, ArrowElement, BadgeElement } from "../types";

const W = 1080;
const H = 1080;

function createMockCtx(): CanvasRenderingContext2D {
  const ctx = {
    font: "",
    measureText: vi.fn((text: string) => ({
      width: text.length * 10,
    })),
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

function makeHeadline(overrides: Partial<HeadlineElement> = {}): HeadlineElement {
  return {
    id: "h1", type: "headline", x: 10, y: 10, text: "Test",
    fontSize: 24, bold: true, color: "#000", opacity: 100, width: 50,
    textStyle: "none", textAlign: "left",
    ...overrides,
  };
}

function makeCircle(overrides: Partial<CircleElement> = {}): CircleElement {
  return {
    id: "c1", type: "circle", x: 50, y: 50, color: "#F00", opacity: 100, radius: 10,
    ...overrides,
  };
}

function makeArrow(overrides: Partial<ArrowElement> = {}): ArrowElement {
  return {
    id: "a1", type: "arrow", x: 50, y: 50, color: "#000", opacity: 100,
    length: 10, rotation: 0, fontSize: 14, text: "Arrow",
    ...overrides,
  };
}

function makeBadge(overrides: Partial<BadgeElement> = {}): BadgeElement {
  return {
    id: "b1", type: "badge", x: 20, y: 20, text: "NEW", fontSize: 14,
    color: "#FFF", bgColor: "#F00", opacity: 100,
    ...overrides,
  };
}

describe("hitTesting", () => {
  beforeEach(() => {
    clearTextCache();
  });

  describe("getElementBounds", () => {
    it("returns bounds for a headline element", () => {
      const ctx = createMockCtx();
      const el = makeHeadline();
      const bounds = getElementBounds(el, ctx, W, H);
      expect(bounds.x1).toBeLessThan(bounds.x2);
      expect(bounds.y1).toBeLessThan(bounds.y2);
    });

    it("returns bounds for a circle element", () => {
      const ctx = createMockCtx();
      const el = makeCircle({ x: 50, y: 50, radius: 10 });
      const bounds = getElementBounds(el, ctx, W, H);
      const center = (50 / 100) * W;
      const r = (10 / 100) * W / 2;
      expect(bounds.x1).toBe(center - r);
      expect(bounds.x2).toBe(center + r);
    });

    it("returns bounds for an arrow element", () => {
      const ctx = createMockCtx();
      const el = makeArrow({ rotation: 0, length: 10 });
      const bounds = getElementBounds(el, ctx, W, H);
      expect(bounds.x2).toBeGreaterThan(bounds.x1);
    });

    it("returns bounds for a badge element", () => {
      const ctx = createMockCtx();
      const el = makeBadge();
      const bounds = getElementBounds(el, ctx, W, H);
      expect(bounds.x1).toBeLessThan(bounds.x2);
      expect(bounds.y1).toBeLessThan(bounds.y2);
    });
  });

  describe("getElementSizePercent", () => {
    it("returns size in percentage", () => {
      const ctx = createMockCtx();
      const el = makeCircle({ radius: 10 });
      const size = getElementSizePercent(el, ctx, W, H);
      expect(size.w).toBeGreaterThan(0);
      expect(size.h).toBeGreaterThan(0);
    });
  });

  describe("hitTest", () => {
    it("returns element when mouse is inside bounds", () => {
      const ctx = createMockCtx();
      const el = makeCircle({ x: 50, y: 50, radius: 10 });
      // Mouse at circle center in pixel coords
      const mx = (50 / 100) * W;
      const my = (50 / 100) * H;
      const result = hitTest(mx, my, [el], ctx, W, H, 50);
      expect(result).not.toBeNull();
      expect(result!.element.id).toBe("c1");
    });

    it("returns null when mouse is outside all elements", () => {
      const ctx = createMockCtx();
      const el = makeCircle({ x: 50, y: 50, radius: 5 });
      const result = hitTest(0, 0, [el], ctx, W, H, 10);
      expect(result).toBeNull();
    });

    it("returns topmost element (last in array) when elements overlap", () => {
      const ctx = createMockCtx();
      const el1 = makeCircle({ id: "bottom", x: 50, y: 50, radius: 20 });
      const el2 = makeCircle({ id: "top", x: 50, y: 50, radius: 20 });
      const mx = (50 / 100) * W;
      const my = (50 / 100) * H;
      const result = hitTest(mx, my, [el1, el2], ctx, W, H, 50);
      expect(result!.element.id).toBe("top");
    });

    it("returns null for empty elements array", () => {
      const ctx = createMockCtx();
      const result = hitTest(500, 500, [], ctx, W, H, 50);
      expect(result).toBeNull();
    });
  });

  describe("hitTestResizeHandle", () => {
    it("returns null when no selected element", () => {
      const ctx = createMockCtx();
      const result = hitTestResizeHandle(100, 100, undefined, ctx, W, H);
      expect(result).toBeNull();
    });

    it("returns handle for text element at right edge", () => {
      const ctx = createMockCtx();
      const el = makeHeadline();
      const bounds = getElementBounds(el, ctx, W, H);
      // Click on right edge midpoint
      const mx = bounds.x2;
      const my = (bounds.y1 + bounds.y2) / 2;
      const result = hitTestResizeHandle(mx, my, el, ctx, W, H);
      expect(result).not.toBeNull();
      expect(result!.handle).toBe("right");
    });

    it("returns handle for circle at bottom-right", () => {
      const ctx = createMockCtx();
      const el = makeCircle();
      const bounds = getElementBounds(el, ctx, W, H);
      const result = hitTestResizeHandle(bounds.x2, bounds.y2, el, ctx, W, H);
      expect(result).not.toBeNull();
      expect(result!.handle).toBe("bottom-right");
    });

    it("returns null for badge elements (no handle)", () => {
      const ctx = createMockCtx();
      const el = makeBadge();
      const bounds = getElementBounds(el, ctx, W, H);
      const result = hitTestResizeHandle(bounds.x2, bounds.y2, el, ctx, W, H);
      expect(result).toBeNull();
    });

    it("returns null when mouse is far from any handle", () => {
      const ctx = createMockCtx();
      const el = makeHeadline();
      // Click far from the element
      const result = hitTestResizeHandle(0, 0, el, ctx, W, H);
      expect(result).toBeNull();
    });
  });
});
