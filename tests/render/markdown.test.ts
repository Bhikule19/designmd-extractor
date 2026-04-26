import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/render/markdown";
import type { ExtractedTokens } from "@/lib/types";

const sampleTokens: ExtractedTokens = {
  meta: {
    url: "https://example.com",
    hostname: "example.com",
    name: "Example",
    tagline: "An example site",
    fetchedAt: "2026-04-26T00:00:00.000Z",
  },
  colors: {
    primary: [
      {
        name: "color-brand",
        hex: "#635bff",
        oklch: { l: 0.5, c: 0.2, h: 280 },
        role: "primary",
        usage: "buttons, links",
        occurrences: 8,
      },
    ],
    neutral: [
      {
        name: "color-surface",
        hex: "#ffffff",
        oklch: { l: 1, c: 0, h: 0 },
        role: "neutral",
        usage: "backgrounds",
        occurrences: 12,
      },
    ],
    semantic: [
      {
        name: "color-error",
        hex: "#df1b41",
        oklch: { l: 0.5, c: 0.2, h: 20 },
        role: "semantic",
        semanticKind: "error",
        usage: "Error states, destructive actions",
        occurrences: 3,
      },
    ],
  },
  typography: {
    fonts: [{ family: "Inter", fallbacks: ["sans-serif"], source: "unknown" }],
    roles: [
      {
        role: "h1",
        family: "Inter",
        size: 40,
        weight: 700,
        lineHeight: 1.2,
      },
      {
        role: "body",
        family: "Inter",
        size: 16,
        weight: 400,
        lineHeight: 1.6,
      },
    ],
  },
  spacing: [
    { name: "space-1", value: 8, unit: "px", usage: "Tight spacing" },
    { name: "space-2", value: 24, unit: "px", usage: "Component spacing" },
  ],
  radius: [
    { name: "radius-md", value: 8, unit: "px", usage: "Buttons, inputs" },
  ],
  shadows: [
    { name: "shadow-sm", value: "0 1px 2px rgba(0,0,0,0.05)", usage: "Cards" },
  ],
  components: {
    buttons: [],
  },
  assets: { fontHrefs: [] },
  diagnostics: {
    htmlBytes: 1000,
    cssBytes: 5000,
    stylesheetCount: 1,
    cssCustomPropertyCount: 4,
    warnings: [],
  },
};

describe("renderMarkdown", () => {
  const md = renderMarkdown(sampleTokens);

  it("starts with a YAML frontmatter block", () => {
    expect(md.startsWith("---")).toBe(true);
    expect(md).toContain("name: Example");
  });

  it("includes the deterministic disclaimer in the overview", () => {
    expect(md).toContain("deterministically");
  });

  it("includes colour, typography, spacing, radius and elevation sections", () => {
    expect(md).toContain("## Colours");
    expect(md).toContain("## Typography");
    expect(md).toContain("## Spacing");
    expect(md).toContain("## Border Radius");
    expect(md).toContain("## Elevation");
  });

  it("includes a Do's and Don'ts section", () => {
    expect(md).toContain("Do's and Don'ts");
  });

  it("includes hex codes and token names", () => {
    expect(md).toContain("#635bff");
    expect(md).toContain("color-brand");
  });
});
