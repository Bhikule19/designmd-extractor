import type { ShadowToken } from "@/lib/types";
import type { ParsedCss } from "@/lib/extract/css-walker";

interface RawShadow {
  value: string;
  blur: number;
  count: number;
}

export function extractShadows(parsed: ParsedCss): ShadowToken[] {
  const map = new Map<string, RawShadow>();

  for (const rule of parsed.rules) {
    const value = rule.declarations["box-shadow"];
    if (!value || value.toLowerCase() === "none") continue;
    const normalised = normaliseShadow(value);
    if (!normalised) continue;
    const existing = map.get(normalised);
    const blur = readBlur(normalised);
    if (existing) {
      map.set(normalised, { ...existing, count: existing.count + 1 });
    } else {
      map.set(normalised, { value: normalised, blur, count: 1 });
    }
  }

  const sorted = [...map.values()]
    .filter((s) => s.count >= 2)
    .sort((a, b) => a.blur - b.blur);

  if (sorted.length === 0) return [];

  const buckets: ShadowToken[] = [];
  const naming: ShadowToken["name"][] = ["shadow-sm", "shadow-md", "shadow-lg"];
  const usage = [
    "Cards at rest, low ambient elevation",
    "Dropdowns, popovers",
    "Modals, overlays",
  ];

  for (let i = 0; i < Math.min(sorted.length, 3); i++) {
    buckets.push({
      name: naming[i],
      value: sorted[i].value,
      usage: usage[i],
    });
  }

  return buckets;
}

function normaliseShadow(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed;
}

function readBlur(value: string): number {
  const numbers = value.match(/-?\d+\.?\d*/g);
  if (!numbers || numbers.length < 3) return 0;
  return parseFloat(numbers[2]);
}
