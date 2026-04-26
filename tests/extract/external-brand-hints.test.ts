import { describe, it, expect } from "vitest";
import { parseCss } from "@/lib/extract/css-walker";
import { extractColors } from "@/lib/extract/colors";

describe("external brand hints (theme-color / manifest)", () => {
  it("promotes a theme-color hex above a noisy CSS palette", () => {
    const css = `
      :root {
        --colors-orange9: #f76808;
        --colors-orange8: #f76300;
        --colors-orange7: #fe6100;
      }
      .has-orange-color { color: #f76808; }
      .has-orange-background { background-color: #f76808; }
      .menu-link { color: #4c2ad2; }
    `;
    const parsed = parseCss(css);

    const externalBrandHints = new Map([
      [
        "#4c2ad2" as `#${string}`,
        { weight: 240, name: "meta[name=theme-color]" },
      ],
    ]);

    const result = extractColors(parsed, { externalBrandHints });
    expect(result.primary[0]?.hex).toBe("#4c2ad2");
  });

  it("does nothing when no external hints are passed", () => {
    const css = `
      .heavy { color: #f76808; background: #f76808; border-color: #f76808; }
      .light { color: #4c2ad2; }
    `;
    const parsed = parseCss(css);
    const result = extractColors(parsed, {});
    expect(result.primary[0]?.hex).toBe("#f76808");
  });
});
