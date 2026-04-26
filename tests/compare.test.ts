import { describe, it, expect } from "vitest";
import { compareTokens, diffColors } from "@/lib/compare";
import type {
  ColorToken,
  ExtractedTokens,
  TypographyRole,
} from "@/lib/types";

function color(
  name: string,
  hex: string,
  oklch: { l: number; c: number; h: number }
): ColorToken {
  return {
    name,
    hex: hex as `#${string}`,
    oklch,
    role: "primary",
    usage: "test",
    occurrences: 1,
  };
}

function tokens(overrides: Partial<ExtractedTokens> = {}): ExtractedTokens {
  return {
    meta: {
      url: "https://example.com",
      hostname: "example.com",
      name: "Example",
      tagline: "",
      fetchedAt: "2026-04-26T00:00:00.000Z",
    },
    colors: { primary: [], neutral: [], semantic: [] },
    typography: { fonts: [], roles: [] },
    spacing: [],
    radius: [],
    shadows: [],
    components: { buttons: [] },
    assets: { fontHrefs: [] },
    diagnostics: {
      htmlBytes: 0,
      cssBytes: 0,
      stylesheetCount: 0,
      cssCustomPropertyCount: 0,
      warnings: [],
    },
    ...overrides,
  };
}

describe("diffColors", () => {
  it("matches near-identical hexes via ΔE2000", () => {
    const a = [color("brand-a", "#635BFF", { l: 0.58, c: 0.23, h: 274 })];
    const b = [color("brand-b", "#6259FE", { l: 0.58, c: 0.23, h: 274 })];
    const d = diffColors(a, b);
    expect(d.shared).toHaveLength(1);
    expect(d.shared[0].deltaE).toBeLessThan(2);
    expect(d.aOnly).toEqual([]);
    expect(d.bOnly).toEqual([]);
  });

  it("keeps far-apart hexes as unique to each side", () => {
    const a = [color("a", "#3ecf8e", { l: 0.78, c: 0.16, h: 154 })];
    const b = [color("b", "#ff0000", { l: 0.63, c: 0.26, h: 29 })];
    const d = diffColors(a, b);
    expect(d.shared).toHaveLength(0);
    expect(d.aOnly).toHaveLength(1);
    expect(d.bOnly).toHaveLength(1);
  });

  it("never double-counts a single B colour", () => {
    const shared = color("brand", "#635BFF", { l: 0.58, c: 0.23, h: 274 });
    const a = [shared, color("alt", "#7170FF", { l: 0.62, c: 0.18, h: 274 })];
    const b = [color("only-b", "#635BFE", { l: 0.58, c: 0.23, h: 274 })];
    const d = diffColors(a, b);
    expect(d.shared).toHaveLength(1);
    expect(d.aOnly).toHaveLength(1);
    expect(d.bOnly).toHaveLength(0);
  });
});

describe("compareTokens summary", () => {
  it("counts shared categories correctly", () => {
    const role = (
      r: TypographyRole["role"],
      family = "Inter"
    ): TypographyRole => ({
      role: r,
      family,
      size: 16,
      weight: 400,
      lineHeight: 1.5,
    });

    const a = tokens({
      colors: {
        primary: [color("brand", "#635BFF", { l: 0.58, c: 0.23, h: 274 })],
        neutral: [],
        semantic: [],
      },
      typography: {
        fonts: [{ family: "Inter", fallbacks: [], source: "unknown" }],
        roles: [role("h1"), role("body")],
      },
      spacing: [
        { name: "sm", value: 8, unit: "px", usage: "" },
        { name: "md", value: 16, unit: "px", usage: "" },
      ],
      radius: [{ name: "radius-md", value: 8, unit: "px", usage: "" }],
    });

    const b = tokens({
      colors: {
        primary: [color("brand-b", "#6259FE", { l: 0.58, c: 0.23, h: 274 })],
        neutral: [],
        semantic: [],
      },
      typography: {
        fonts: [{ family: "Inter", fallbacks: [], source: "unknown" }],
        roles: [role("h1"), role("h2")],
      },
      spacing: [
        { name: "sm", value: 8, unit: "px", usage: "" },
        { name: "lg", value: 24, unit: "px", usage: "" },
      ],
      radius: [{ name: "radius-md", value: 8, unit: "px", usage: "" }],
    });

    const result = compareTokens(a, b);
    expect(result.summary.colorsShared).toBe(1);
    expect(result.summary.typographyShared).toBe(1); // h1 only
    expect(result.summary.spacingShared).toBe(1); // sm only
    expect(result.summary.radiusShared).toBe(1);
    expect(result.fonts.shared).toContain("Inter");
  });
});
