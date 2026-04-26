import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCss } from "@/lib/extract/css-walker";
import { extractSpacing } from "@/lib/extract/spacing";

const css = readFileSync(
  join(__dirname, "..", "fixtures", "sample.css"),
  "utf8"
);

describe("extractSpacing", () => {
  const parsed = parseCss(css);
  const spacing = extractSpacing(parsed);

  it("returns a sorted scale", () => {
    expect(spacing.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < spacing.length; i++) {
      expect(spacing[i].value).toBeGreaterThanOrEqual(spacing[i - 1].value);
    }
  });

  it("snaps to common 8px multiples", () => {
    const values = spacing.map((s) => s.value);
    expect(values).toEqual(expect.arrayContaining([24]));
    expect(values.some((v) => v === 16 || v === 12)).toBe(true);
  });

  it("names tokens space-N", () => {
    expect(spacing[0].name).toMatch(/^space-\d+$/);
  });
});
