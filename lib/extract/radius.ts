import type { RadiusToken } from "@/lib/types";
import type { ParsedCss } from "@/lib/extract/css-walker";
import { parseLengthToPx } from "@/lib/extract/typography";

const RADIUS_PROPERTIES = [
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
];

export function extractRadius(parsed: ParsedCss): RadiusToken[] {
  const counts = new Map<number, number>();
  let hasFullRadius = false;

  for (const rule of parsed.rules) {
    for (const property of RADIUS_PROPERTIES) {
      const value = rule.declarations[property];
      if (!value) continue;
      const tokens = value.split(/\s+/);
      for (const t of tokens) {
        if (/^9999/.test(t) || /^50%/.test(t)) {
          hasFullRadius = true;
          continue;
        }
        const px = parseLengthToPx(t);
        if (px === null || px < 0 || px > 64) continue;
        const snapped = Math.round(px / 2) * 2;
        counts.set(snapped, (counts.get(snapped) ?? 0) + 1);
      }
    }
  }

  const sorted = [...counts.entries()]
    .filter(([px, count]) => count >= 2 && px > 0)
    .sort(([a], [b]) => a - b);

  const tokens: RadiusToken[] = [];
  const naming: RadiusToken["name"][] = [
    "radius-sm",
    "radius-md",
    "radius-lg",
    "radius-xl",
  ];
  for (let i = 0; i < Math.min(sorted.length, naming.length); i++) {
    const [px] = sorted[i];
    tokens.push({
      name: naming[i],
      value: px,
      unit: "px",
      usage: radiusUsage(naming[i]),
    });
  }

  if (hasFullRadius) {
    tokens.push({
      name: "radius-full",
      value: 9999,
      unit: "px",
      usage: "Avatars, pills, circular badges",
    });
  }

  return tokens;
}

function radiusUsage(name: RadiusToken["name"]): string {
  switch (name) {
    case "radius-sm":
      return "Badges, tags";
    case "radius-md":
      return "Buttons, inputs";
    case "radius-lg":
      return "Cards, modals";
    case "radius-xl":
      return "Hero sections, prominent cards";
    case "radius-full":
      return "Avatars, pills, circular badges";
  }
}
