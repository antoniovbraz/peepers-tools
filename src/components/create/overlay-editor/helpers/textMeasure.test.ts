import { describe, it, expect, vi, beforeEach } from "vitest";
import { measureTextBlock, clearTextCache } from "./textMeasure";

function createMockCtx(): CanvasRenderingContext2D {
  const ctx = {
    font: "",
    measureText: vi.fn((text: string) => ({
      width: text.length * 8, // ~8px per char
    })),
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

describe("textMeasure", () => {
  beforeEach(() => {
    clearTextCache();
  });

  describe("measureTextBlock", () => {
    it("returns empty result for empty text", () => {
      const ctx = createMockCtx();
      const result = measureTextBlock(ctx, "", 16, false, 200);
      expect(result.lines).toHaveLength(0);
      expect(result.totalWidth).toBe(0);
      expect(result.totalHeight).toBe(0);
    });

    it("returns single line for short text", () => {
      const ctx = createMockCtx();
      const result = measureTextBlock(ctx, "Hello", 16, false, 200);
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toBe("Hello");
      expect(result.totalHeight).toBe(16 * 1.3);
    });

    it("wraps text into multiple lines", () => {
      const ctx = createMockCtx();
      // "Hello World Foo" with maxWidth 80px and 8px/char means ~10 chars per line
      const result = measureTextBlock(ctx, "Hello World Foo Bar", 16, false, 80);
      expect(result.lines.length).toBeGreaterThan(1);
    });

    it("sets font correctly on ctx", () => {
      const ctx = createMockCtx();
      measureTextBlock(ctx, "Test", 20, true, 200);
      expect(ctx.font).toContain("bold");
      expect(ctx.font).toContain("20px");
    });

    it("sets font without bold when bold is false", () => {
      const ctx = createMockCtx();
      measureTextBlock(ctx, "Test", 20, false, 200);
      expect(ctx.font).not.toContain("bold");
    });

    it("returns cached result on second call with same params", () => {
      const ctx = createMockCtx();
      const result1 = measureTextBlock(ctx, "Cache test", 16, false, 200);
      const result2 = measureTextBlock(ctx, "Cache test", 16, false, 200);
      expect(result1).toBe(result2); // Same object reference = cached
    });

    it("returns different result for different params", () => {
      const ctx = createMockCtx();
      const result1 = measureTextBlock(ctx, "A", 16, false, 200);
      const result2 = measureTextBlock(ctx, "B", 16, false, 200);
      expect(result1).not.toBe(result2);
    });

    it("lineHeight is 1.3x fontSize", () => {
      const ctx = createMockCtx();
      const result = measureTextBlock(ctx, "Test", 20, false, 200);
      expect(result.lineHeight).toBe(26);
    });
  });

  describe("clearTextCache", () => {
    it("clears the cache so new measurements are recalculated", () => {
      const ctx = createMockCtx();
      const result1 = measureTextBlock(ctx, "Clear test", 16, false, 200);
      clearTextCache();
      const result2 = measureTextBlock(ctx, "Clear test", 16, false, 200);
      // After clearing, a new object should be created (not the same reference)
      expect(result1).not.toBe(result2);
      // But values should be the same
      expect(result1.lines).toEqual(result2.lines);
    });
  });
});
