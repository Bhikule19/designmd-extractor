import { describe, it, expect } from "vitest";
import { parseCss } from "@/lib/extract/css-walker";
import { extractColors } from "@/lib/extract/colors";

describe("brand-intent priority", () => {
  it("prefers --brand-default over high-frequency palette tokens", () => {
    const css = `
      :root {
        --brand-default: #3ecf8e;
        --colors-orange9: hsl(24, 94%, 50%);
        --colors-orange8: hsl(25, 100%, 50.1%);
        --colors-orange7: hsl(26, 100%, 50%);
        --colors-orangeA1: hsla(25, 100%, 50%, 0.05);
        --colors-orangeA2: hsla(25, 100%, 50%, 0.1);
        --colors-orangeA3: hsla(25, 100%, 50%, 0.15);
        --colors-orangeA4: hsla(25, 100%, 50%, 0.2);
        --colors-orangeA5: hsla(25, 100%, 50%, 0.25);
      }
      .heading-gradient-brand { background: linear-gradient(#3ecf8e, transparent); }
      .from-\\[\\#3ECF8E\\] { --tw-gradient-from: #3ECF8E; }
    `;
    const parsed = parseCss(css);
    const colors = extractColors(parsed);
    expect(colors.primary[0]?.hex).toBe("#3ecf8e");
  });

  it("parses raw HSL component custom properties (Tailwind/shadcn pattern)", () => {
    const css = `
      :root {
        --primary: 153.1deg 60.2% 52.7%;
        --primary-foreground: 0 0% 100%;
      }
      .text-fg { color: hsl(var(--primary)); }
    `;
    const parsed = parseCss(css);
    const colors = extractColors(parsed);
    expect(colors.primary.length).toBeGreaterThan(0);
    const brand = colors.primary[0];
    expect(brand.hex.toLowerCase()).toMatch(/#[34][a-f0-9][a-f0-9]/);
  });

  it("does not crown a Radix palette token as brand when no real usage", () => {
    const css = `
      :root {
        --colors-orange9: hsl(24, 94%, 50%);
        --colors-orange10: hsl(25, 95%, 50%);
        --colors-orange11: hsl(26, 96%, 50%);
        --colors-orange12: hsl(27, 97%, 50%);
        --brand-default: #3ecf8e;
      }
      .btn-primary { background-color: #3ecf8e; color: #fff; }
      .btn-primary:hover { background-color: #2bb37a; }
    `;
    const parsed = parseCss(css);
    const colors = extractColors(parsed);
    expect(colors.primary[0]?.hex).toBe("#3ecf8e");
    const allHexes = colors.primary.map((c) => c.hex);
    expect(allHexes).not.toContain("#f76808");
  });
});
