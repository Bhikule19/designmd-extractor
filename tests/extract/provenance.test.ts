import { describe, it, expect } from "vitest";
import { parseCss } from "@/lib/extract/css-walker";
import { extractColors } from "@/lib/extract/colors";

describe("colour token provenance", () => {
  it("attaches the top declaring selectors to each token", () => {
    const css = `
      .hero-cta { background-color: #3ecf8e; }
      .hero-cta:hover { background-color: #3ecf8e; }
      .feature-callout { color: #3ecf8e; }
    `;
    const parsed = parseCss(css);
    const result = extractColors(parsed);
    const brand = result.primary.find((c) => c.hex === "#3ecf8e");
    expect(brand).toBeTruthy();
    expect(brand!.provenance).toBeDefined();
    expect(brand!.provenance!.length).toBeGreaterThan(0);

    const allSelectors = brand!.provenance!.map((p) => p.selector);
    expect(allSelectors.some((s) => s.includes(".hero-cta"))).toBe(true);
    expect(allSelectors.some((s) => s.includes(".feature-callout"))).toBe(
      true
    );

    // Each entry carries a CSS property name and a numeric weight.
    for (const p of brand!.provenance!) {
      expect(typeof p.selector).toBe("string");
      expect(typeof p.property).toBe("string");
      expect(typeof p.weight).toBe("number");
      expect(p.weight).toBeGreaterThan(0);
    }
  });

  it("caps the provenance list to the top N entries", () => {
    const rules = Array.from({ length: 30 }, (_, i) =>
      `.row-${i} { background-color: #ff8800; }`
    ).join("\n");
    const parsed = parseCss(rules);
    const result = extractColors(parsed);
    const brand = result.primary[0];
    expect(brand?.provenance?.length).toBeLessThanOrEqual(6);
  });

  it("truncates very long selectors so the modal stays readable", () => {
    const giantSelector = ".x".repeat(400);
    const css = `${giantSelector} { color: #ff0000; } .x { color: #ff0000; } .y { color: #ff0000; }`;
    const parsed = parseCss(css);
    const result = extractColors(parsed);
    const tok = result.primary[0];
    if (tok && tok.provenance) {
      const long = tok.provenance.find((p) => p.selector.startsWith(".x.x"));
      if (long) {
        expect(long.selector.length).toBeLessThanOrEqual(241); // 240 + ellipsis
        expect(long.selector.endsWith("…")).toBe(true);
      }
    }
  });
});
