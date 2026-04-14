import { describe, it, expect } from "vitest";
import { getSnappedPos, clampToCanvas } from "./dragEngine";
import type { ElementSnapInfo } from "./dragEngine";

describe("dragEngine", () => {
  describe("getSnappedPos", () => {
    it("snaps left edge to 5% line", () => {
      const result = getSnappedPos(4.5, 30);
      expect(result.x).toBe(5);
      expect(result.guidesX).toContain(5);
    });

    it("snaps center to 50% line when element has width", () => {
      // Element at x=40 with width 20 → center is at 50
      const result = getSnappedPos(40, 30, 20, 10);
      expect(result.x).toBe(40); // center at 50 snaps, so x = 50 - 20/2 = 40
      expect(result.guidesX).toContain(50);
    });

    it("returns no guides when no snap threshold met", () => {
      const result = getSnappedPos(25, 25, 10, 10);
      expect(result.guidesX).toHaveLength(0);
      expect(result.guidesY).toHaveLength(0);
    });

    it("snaps to fixed 95% line on the right edge", () => {
      // Element right edge at x + elW = 94.5 + 0.5 → close enough to 95
      const result = getSnappedPos(94.5, 30, 0.5);
      expect(result.guidesX).toContain(95);
    });

    it("snaps y center to 50% line", () => {
      const result = getSnappedPos(10, 45, 0, 10);
      expect(result.y).toBe(45); // center 50, snap → y = 50 - 5 = 45
      expect(result.guidesY).toContain(50);
    });

    it("snaps to other element edges when elementSnaps provided", () => {
      const snaps: ElementSnapInfo[] = [
        { id: "other", x: 30, y: 20, w: 20, h: 10 },
      ];
      // Element left edge at 30.5, close to other element's left edge at 30
      const result = getSnappedPos(30.5, 60, 10, 5, snaps);
      expect(result.x).toBe(30);
      expect(result.guidesX).toContain(30);
    });

    it("snaps to other element center", () => {
      const snaps: ElementSnapInfo[] = [
        { id: "other", x: 30, y: 20, w: 20, h: 10 },
      ];
      // other center x = 40. Element left edge at 39.5
      const result = getSnappedPos(39.5, 60, 0, 0, snaps);
      expect(result.x).toBe(40);
    });

    it("snaps to other element right edge", () => {
      const snaps: ElementSnapInfo[] = [
        { id: "other", x: 30, y: 20, w: 20, h: 10 },
      ];
      // other right edge = 50. Element left edge at 49.5
      const result = getSnappedPos(49.5, 60, 0, 0, snaps);
      expect(result.x).toBe(50);
      expect(result.guidesX).toContain(50);
    });

    it("works with empty elementSnaps array", () => {
      const result = getSnappedPos(25, 25, 10, 10, []);
      expect(result.guidesX).toHaveLength(0);
    });
  });

  describe("clampToCanvas", () => {
    it("clamps negative x to 0", () => {
      const result = clampToCanvas(-5, 50, 10, 10);
      expect(result.x).toBe(0);
    });

    it("clamps x so element stays within 100%", () => {
      const result = clampToCanvas(95, 50, 10, 10);
      expect(result.x).toBe(90); // 100 - 10
    });

    it("clamps negative y to 0", () => {
      const result = clampToCanvas(50, -3, 10, 10);
      expect(result.y).toBe(0);
    });

    it("clamps y so element stays within 100%", () => {
      const result = clampToCanvas(50, 96, 10, 10);
      expect(result.y).toBe(90); // 100 - 10
    });

    it("does not change position when within bounds", () => {
      const result = clampToCanvas(30, 40, 10, 10);
      expect(result.x).toBe(30);
      expect(result.y).toBe(40);
    });

    it("handles zero-size elements at edges", () => {
      const result = clampToCanvas(100, 100, 0, 0);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });
  });
});
