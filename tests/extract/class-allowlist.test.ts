import { describe, it, expect } from "vitest";
import { parseCss } from "@/lib/extract/css-walker";
import { extractColors } from "@/lib/extract/colors";

describe("class allowlist weighting", () => {
  it("crowns the colour from a USED class even when an UNUSED class has more occurrences", () => {
    // Build a CSS file where #unused is mentioned in 50 rules but the
    // class never appears in the served HTML; #used is in 5 rules that
    // do appear.
    const unusedRules = Array.from({ length: 50 }, (_, i) =>
      `.never-class-${i} { color: #f76808; background-color: #f76808; }`
    ).join("\n");
    const usedRules = `
      .hero-cta { background-color: #3ecf8e; }
      .feature-callout { background-color: #3ecf8e; color: #ffffff; }
      .pricing-card { border-color: #3ecf8e; }
    `;
    const css = `${unusedRules}\n${usedRules}`;
    const parsed = parseCss(css);

    const domClasses = new Set(["hero-cta", "feature-callout", "pricing-card"]);
    const result = extractColors(parsed, { domClasses });

    expect(result.primary[0]?.hex).toBe("#3ecf8e");
    const allHexes = result.primary.map((c) => c.hex);
    expect(allHexes).not.toContain("#f76808");
  });

  it("falls back to occurrence-only when domClasses is empty", () => {
    const css = `
      .a { color: #ff0000; }
      .a { color: #ff0000; }
      .b { color: #00ff00; }
    `;
    const parsed = parseCss(css);
    const result = extractColors(parsed, { domClasses: new Set() });
    // With no DOM info, multiplier is 1; #ff0000 (2 cites) beats #00ff00 (1 cite)
    const top = result.primary[0]?.hex;
    expect(top).toBe("#ff0000");
  });

  it("element-only selectors are not penalised by the class allowlist", () => {
    const css = `
      h1 { color: #336699; background-color: #336699; }
      .never-used { color: #f76808; }
    `;
    const parsed = parseCss(css);
    const result = extractColors(parsed, {
      domClasses: new Set(["something-else"]),
    });
    const allHexes = result.primary.map((c) => c.hex);
    expect(allHexes).toContain("#336699");
  });
});
