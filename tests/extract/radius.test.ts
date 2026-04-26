import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCss } from "@/lib/extract/css-walker";
import { extractRadius } from "@/lib/extract/radius";

const css = readFileSync(
  join(__dirname, "..", "fixtures", "sample.css"),
  "utf8"
);

describe("extractRadius", () => {
  const parsed = parseCss(css);
  const radii = extractRadius(parsed);

  it("includes a pill radius when 9999px is detected", () => {
    expect(radii.some((r) => r.name === "radius-full")).toBe(true);
  });

  it("includes button-sized and card-sized radii", () => {
    const values = radii.map((r) => r.value);
    expect(values).toEqual(expect.arrayContaining([8]));
  });
});
