import type { ScaleToken } from "@/lib/types";
import type { ParsedCss } from "@/lib/extract/css-walker";
import { parseLengthToPx } from "@/lib/extract/typography";

const SPACING_PROPERTIES = [
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "gap",
  "row-gap",
  "column-gap",
];

const TARGET_SCALE = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];

export function extractSpacing(parsed: ParsedCss): ScaleToken[] {
  const counts = new Map<number, number>();

  for (const rule of parsed.rules) {
    for (const property of SPACING_PROPERTIES) {
      const value = rule.declarations[property];
      if (!value) continue;
      const tokens = value.split(/\s+/);
      for (const t of tokens) {
        const px = parseLengthToPx(t);
        if (px === null || px <= 0 || px > 256) continue;
        const snapped = snapToScale(px);
        counts.set(snapped, (counts.get(snapped) ?? 0) + 1);
      }
    }
  }

  const sorted = [...counts.entries()]
    .filter(([_, count]) => count >= 2)
    .sort(([a], [b]) => a - b);

  return sorted.map(([px], i) => ({
    name: `space-${i + 1}`,
    value: px,
    unit: "px" as const,
    usage: usageForSpacing(px),
  }));
}

function snapToScale(px: number): number {
  let closest = TARGET_SCALE[0];
  let bestDelta = Math.abs(px - closest);
  for (const v of TARGET_SCALE) {
    const d = Math.abs(px - v);
    if (d < bestDelta) {
      bestDelta = d;
      closest = v;
    }
  }
  if (bestDelta > Math.max(closest * 0.2, 4)) return Math.round(px);
  return closest;
}

function usageForSpacing(px: number): string {
  if (px <= 4) return "Inline icon gaps, tight inline padding";
  if (px <= 8) return "Tight element spacing";
  if (px <= 12) return "Form field gaps";
  if (px <= 16) return "Card padding, button padding";
  if (px <= 24) return "Component spacing";
  if (px <= 32) return "Section padding";
  if (px <= 48) return "Large section gaps";
  if (px <= 64) return "Major layout gaps";
  return "Page-level vertical rhythm";
}
