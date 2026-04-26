import { describe, it, expect } from "vitest";
import { parseCss, isColorProperty } from "@/lib/extract/css-walker";

describe("parseCss", () => {
  it("extracts rules and declarations", () => {
    const css = `
      .btn { background-color: #635bff; color: #fff; }
      h1 { font-size: 32px; }
    `;
    const parsed = parseCss(css);
    expect(parsed.rules.length).toBe(2);
    expect(parsed.rules[0].selector.trim()).toBe(".btn");
    expect(parsed.rules[0].declarations["background-color"]).toBe("#635bff");
  });

  it("captures custom properties", () => {
    const css = `:root { --color-brand: #635bff; --space-1: 4px; }`;
    const parsed = parseCss(css);
    expect(parsed.customProperties).toHaveLength(2);
    expect(parsed.customProperties[0].name).toBe("--color-brand");
  });

  it("returns empty parse on invalid CSS without throwing", () => {
    const parsed = parseCss("this is not css {{{");
    expect(parsed.rules).toBeInstanceOf(Array);
  });
});

describe("isColorProperty", () => {
  it("recognises colour-bearing properties", () => {
    expect(isColorProperty("color")).toBe(true);
    expect(isColorProperty("background-color")).toBe(true);
    expect(isColorProperty("border-color")).toBe(true);
    expect(isColorProperty("font-size")).toBe(false);
  });
});
