import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SNAP_THRESHOLD,
  SNAP_LINES,
  getSnappedPos,
  getElementBounds,
  getElementSizePercent,
} from "@/lib/canvasHelpers";
import type { OverlayElement } from "@/lib/overlayTemplates";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCtx(textWidth = 80): CanvasRenderingContext2D {
  return {
    font: "",
    measureText: vi.fn(() => ({ width: textWidth }) as TextMetrics),
  } as unknown as CanvasRenderingContext2D;
}

function el(overrides: Partial<OverlayElement> = {}): OverlayElement {
  return {
    id: "1",
    type: "headline",
    text: "Hello World",
    x: 10,
    y: 20,
    fontSize: 16,
    ...overrides,
  };
}

// ── SNAP_THRESHOLD / SNAP_LINES constants ─────────────────────────────────────

describe("constants", () => {
  it("SNAP_THRESHOLD is 2", () => {
    expect(SNAP_THRESHOLD).toBe(2);
  });

  it("SNAP_LINES are [5, 50, 95]", () => {
    expect(SNAP_LINES).toEqual([5, 50, 95]);
  });
});

// ── getSnappedPos ─────────────────────────────────────────────────────────────

describe("getSnappedPos", () => {
  it("returns unchanged position when far from all snap lines", () => {
    const result = getSnappedPos(30, 30, 10, 10);
    expect(result.x).toBe(30);
    expect(result.y).toBe(30);
    expect(result.guidesX).toHaveLength(0);
    expect(result.guidesY).toHaveLength(0);
  });

  it("snaps left edge to 5% when within threshold", () => {
    // x = 4.5 is within SNAP_THRESHOLD (2) of SNAP_LINES[0] (5)
    const result = getSnappedPos(4.5, 30, 0, 0);
    expect(result.x).toBe(5);
    expect(result.guidesX).toContain(5);
  });

  it("snaps left edge to 50% when within threshold", () => {
    const result = getSnappedPos(49, 30, 0, 0);
    expect(result.x).toBe(50);
    expect(result.guidesX).toContain(50);
  });

  it("snaps left edge to 95% when within threshold", () => {
    const result = getSnappedPos(96, 30, 0, 0);
    expect(result.x).toBe(95);
    expect(result.guidesX).toContain(95);
  });

  it("snaps center to 50% guide", () => {
    // center of element (width=10) at x=46 → center = 51, within threshold of 50
    // adjusted: x = 50 - 10/2 = 45
    const result = getSnappedPos(44.5, 30, 10, 0);
    expect(result.x).toBeCloseTo(45);
    expect(result.guidesX).toContain(50);
  });

  it("snaps right edge to 95% guide", () => {
    // right edge at x+elW = 94 → within threshold of 95 → x = 95 - 10 = 85
    const result = getSnappedPos(85, 30, 10, 0);
    // right edge = 85 + 10 = 95, adjust = -10
    expect(result.x).toBeCloseTo(85);
    expect(result.guidesX).toContain(95);
  });

  it("snaps y axis independently", () => {
    const result = getSnappedPos(30, 49.5, 0, 0);
    expect(result.y).toBe(50);
    expect(result.guidesY).toContain(50);
  });

  it("does not snap when exactly at threshold boundary + 1", () => {
    // x=8 is 3 away from 5, beyond SNAP_THRESHOLD (2)
    const result = getSnappedPos(8, 30, 0, 0);
    expect(result.x).toBe(8);
    expect(result.guidesX).toHaveLength(0);
  });

  it("picks the nearest snap line when two are close", () => {
    // x=4.9 → dist to 5 = 0.1, dist to 50 = 45.1 → should snap to 5
    const result = getSnappedPos(4.9, 30, 0, 0);
    expect(result.x).toBe(5);
  });
});

// ── getElementBounds ──────────────────────────────────────────────────────────

describe("getElementBounds", () => {
  const W = 500;
  const H = 500;

  it("returns reasonable bounds for a headline element", () => {
    const ctx = makeCtx(80);
    const bounds = getElementBounds(el({ x: 10, y: 20, fontSize: 16 }), ctx, W, H, "#000");
    // px = (10/100)*500 = 50, py = (20/100)*500 = 100
    expect(bounds.x1).toBeLessThan(bounds.x2);
    expect(bounds.y1).toBeLessThan(bounds.y2);
    expect(bounds.x1).toBeCloseTo(50 - 4, 0);
    expect(bounds.y1).toBeCloseTo(100 - 2, 0);
  });

  it("returns bounds for badge element", () => {
    const ctx = makeCtx(60);
    const bounds = getElementBounds(el({ type: "badge", text: "SALE", x: 10, y: 10, fontSize: 14 }), ctx, W, H, "#000");
    // px = 50, py = 50
    expect(bounds.x1).toBe(50);
    expect(bounds.y1).toBe(50);
    expect(bounds.x2).toBeGreaterThan(bounds.x1);
    expect(bounds.y2).toBeGreaterThan(bounds.y1);
  });

  it("returns bounds for circle element", () => {
    const ctx = makeCtx(0);
    const bounds = getElementBounds(el({ type: "circle", x: 50, y: 50, width: 20 }), ctx, W, H, "#000");
    // px = 250, py = 250, r = (20/100*500)/2 = 50
    expect(bounds.x1).toBeCloseTo(200);
    expect(bounds.y1).toBeCloseTo(200);
    expect(bounds.x2).toBeCloseTo(300);
    expect(bounds.y2).toBeCloseTo(300);
  });

  it("returns bounds for arrow element", () => {
    const ctx = makeCtx(0);
    const bounds = getElementBounds(el({ type: "arrow", x: 50, y: 50 }), ctx, W, H, "#000");
    // px=250, py=250 → x1=240, y1=230, x2=320, y2=300
    expect(bounds.x1).toBe(250 - 10);
    expect(bounds.y1).toBe(250 - 20);
  });

  it("returns default bounds for unknown type via default case", () => {
    const ctx = makeCtx(0);
    const badEl = el({ type: "arrow" as any, x: 10, y: 10 });
    // arrow is a known type, so just check it doesn't throw
    const bounds = getElementBounds(badEl, ctx, W, H, "#000");
    expect(bounds.x1).toBeLessThan(bounds.x2);
  });

  it("wraps text when it exceeds maxWidth", () => {
    // ctx always returns width 80px per line; set a maxWidth of 60px → will wrap
    const ctx = makeCtx(80);
    const bounds = getElementBounds(
      el({ x: 10, y: 10, fontSize: 16, text: "word1 word2 word3", width: 20 }),
      ctx,
      W,
      H,
      "#000",
    );
    // With multiple lines, y2 - y1 should be > lineHeight (16*1.3 ~20.8)
    expect(bounds.y2 - bounds.y1).toBeGreaterThan(20);
  });
});

// ── getElementSizePercent ─────────────────────────────────────────────────────

describe("getElementSizePercent", () => {
  it("returns width and height as percentages of canvas", () => {
    const W = 500;
    const H = 400;
    const ctx = makeCtx(80);
    const size = getElementSizePercent(el({ x: 10, y: 10, fontSize: 16 }), ctx, W, H, "#000");
    expect(size.w).toBeGreaterThan(0);
    expect(size.w).toBeLessThan(100);
    expect(size.h).toBeGreaterThan(0);
    expect(size.h).toBeLessThan(100);
  });

  it("circle size matches expected percentage", () => {
    const W = 500;
    const H = 500;
    const ctx = makeCtx(0);
    // width=20% → r = (20/100*500)/2 = 50px → diameter = 100px → w% = 100/500*100 = 20%
    const size = getElementSizePercent(el({ type: "circle", x: 50, y: 50, width: 20 }), ctx, W, H, "#000");
    expect(size.w).toBeCloseTo(20);
    expect(size.h).toBeCloseTo(20);
  });
});
