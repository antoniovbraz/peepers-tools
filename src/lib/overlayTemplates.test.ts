import { describe, it, expect } from "vitest";
import { getDefaultTemplate, IMAGE_ROLES } from "@/lib/overlayTemplates";

describe("overlayTemplates", () => {
  it("IMAGE_ROLES has 7 entries", () => {
    expect(IMAGE_ROLES).toHaveLength(7);
  });

  it("cover (index 1) returns empty template", () => {
    const template = getDefaultTemplate(1, "#000", "#FFF");
    expect(template).toEqual([]);
  });

  it("benefits (index 2) returns headline + 3 bullets", () => {
    const template = getDefaultTemplate(2, "#1A2332", "#D4A853");
    expect(template).toHaveLength(4);
    expect(template[0].type).toBe("headline");
    expect(template[1].type).toBe("bullet");
    expect(template[2].type).toBe("bullet");
    expect(template[3].type).toBe("bullet");
    expect(template[0].color).toBe("#1A2332");
  });

  it("features (index 3) returns headline + 3 badges", () => {
    const template = getDefaultTemplate(3, "#000", "#D4A853");
    expect(template).toHaveLength(4);
    expect(template[0].type).toBe("headline");
    expect(template[1].type).toBe("badge");
    expect(template[1].bgColor).toBe("#D4A853");
  });

  it("closeup (index 4) returns circle + arrow", () => {
    const template = getDefaultTemplate(4, "#000", "#FFF");
    expect(template).toHaveLength(2);
    expect(template[0].type).toBe("circle");
    expect(template[1].type).toBe("arrow");
  });

  it("unknown index returns empty", () => {
    const template = getDefaultTemplate(99, "#000", "#FFF");
    expect(template).toEqual([]);
  });

  it("all elements have id, type, x, y", () => {
    for (let i = 1; i <= 7; i++) {
      const template = getDefaultTemplate(i, "#000", "#FFF");
      for (const el of template) {
        expect(el.id).toBeDefined();
        expect(el.type).toBeDefined();
        expect(typeof el.x).toBe("number");
        expect(typeof el.y).toBe("number");
      }
    }
  });
});
