import { describe, it, expect } from "vitest";
import { parseCss } from "@/lib/extract/css-walker";
import { extractColors } from "@/lib/extract/colors";

describe("framework / WordPress noise filtering", () => {
  it("does not crown --wp-admin-theme-color when it dominates by raw count", () => {
    const wpAdminBlue = "#007cba";
    const realBrand = "#4c2ad2";
    const wpRules = Array.from({ length: 200 }, (_, i) => {
      const slug = `block-${i.toString(16)}`;
      return `.wp-block-uagb-advanced-heading.uagb-${slug} .uagb-highlight { color: ${wpAdminBlue}; }`;
    }).join("\n");
    const css = `
      :root { --wp-admin-theme-color: ${wpAdminBlue}; }
      ${wpRules}
      .hero-bg { background-color: ${realBrand}; }
      .cta-section { background-color: ${realBrand}; }
      .feature-callout { background-color: ${realBrand}; }
    `;
    const parsed = parseCss(css);
    const colors = extractColors(parsed);
    const top = colors.primary[0]?.hex;
    expect(top).toBe(realBrand);
  });

  it("resolves var() chains in brand-intent custom properties (Astra-style)", () => {
    const css = `
      :root {
        --ast-global-color-primary: var(--ast-global-color-5);
        --ast-global-color-5: #181818;
        --ast-global-color-0: #d2f059;
      }
      .hero { color: hsl(var(--ast-global-color-primary)); }
    `;
    const parsed = parseCss(css);
    const colors = extractColors(parsed);
    const allHexes = [
      ...colors.primary.map((c) => c.hex),
      ...colors.neutral.map((c) => c.hex),
    ];
    expect(allHexes).toContain("#181818");
  });

  it("doesn't classify a near-grayscale colour as semantic info just because the selector says info", () => {
    const css = `
      .info-callout { color: #181818; background: #ffffff; }
      .info-callout strong { color: #181818; }
    `;
    const parsed = parseCss(css);
    const colors = extractColors(parsed);
    expect(colors.semantic).toHaveLength(0);
  });
});
