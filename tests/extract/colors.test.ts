import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCss } from "@/lib/extract/css-walker";
import { extractColors } from "@/lib/extract/colors";

const css = readFileSync(
  join(__dirname, "..", "fixtures", "sample.css"),
  "utf8"
);

describe("extractColors", () => {
  const parsed = parseCss(css);
  const colors = extractColors(parsed);

  it("identifies a primary brand colour", () => {
    expect(colors.primary.length).toBeGreaterThan(0);
    const hexes = colors.primary.map((c) => c.hex);
    expect(hexes).toContain("#635bff");
  });

  it("classifies neutrals", () => {
    expect(colors.neutral.length).toBeGreaterThan(0);
    const hexes = colors.neutral.map((c) => c.hex);
    expect(hexes.some((h) => h === "#ffffff" || h === "#0a2540")).toBe(true);
  });

  it("detects semantic colours by hue", () => {
    const kinds = colors.semantic.map((c) => c.semanticKind).sort();
    expect(kinds).toEqual(
      expect.arrayContaining(["error", "success"])
    );
  });

  it("never duplicates a semantic kind", () => {
    const kinds = colors.semantic.map((c) => c.semanticKind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});
