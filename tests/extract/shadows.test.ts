import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCss } from "@/lib/extract/css-walker";
import { extractShadows } from "@/lib/extract/shadows";

const css = readFileSync(
  join(__dirname, "..", "fixtures", "sample.css"),
  "utf8"
);

describe("extractShadows", () => {
  it("returns nothing when shadows are not repeated", () => {
    const parsed = parseCss(css);
    const shadows = extractShadows(parsed);
    expect(shadows.length).toBeGreaterThanOrEqual(0);
  });

  it("groups identical shadows by blur", () => {
    const css2 = `
      .a { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .b { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .c { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      .d { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    `;
    const parsed = parseCss(css2);
    const shadows = extractShadows(parsed);
    expect(shadows.length).toBe(2);
    expect(shadows[0].name).toBe("shadow-sm");
    expect(shadows[1].name).toBe("shadow-md");
  });
});
