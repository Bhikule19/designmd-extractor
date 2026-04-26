import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCss } from "@/lib/extract/css-walker";
import { extractTypography } from "@/lib/extract/typography";

const css = readFileSync(
  join(__dirname, "..", "fixtures", "sample.css"),
  "utf8"
);

describe("extractTypography", () => {
  const parsed = parseCss(css);
  const typo = extractTypography(parsed);

  it("identifies the primary font family", () => {
    expect(typo.fonts.length).toBeGreaterThan(0);
    expect(typo.fonts[0].family).toBe("Inter");
  });

  it("extracts heading and body roles", () => {
    const roles = typo.roles.map((r) => r.role);
    expect(roles).toContain("h1");
    expect(roles).toContain("h2");
    expect(roles).toContain("body");
    expect(roles).toContain("code");
  });

  it("extracts h1 size and weight", () => {
    const h1 = typo.roles.find((r) => r.role === "h1");
    expect(h1?.size).toBe(40);
    expect(h1?.weight).toBe(700);
  });

  it("identifies a monospace font for code role", () => {
    const code = typo.roles.find((r) => r.role === "code");
    expect(code?.family.toLowerCase()).toContain("mono");
  });
});
