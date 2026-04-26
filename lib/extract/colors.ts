import {
  converter,
  differenceCiede2000,
  formatHex,
  parse as parseColor,
} from "culori";
import type { ColorToken, Hex, SemanticKind } from "@/lib/types";
import {
  isColorProperty,
  type ParsedCss,
  type CssCustomProperty,
} from "@/lib/extract/css-walker";

const toOklch = converter("oklch");
const diff = differenceCiede2000();
const CLUSTER_THRESHOLD = 2.5;

const UTILITY_RULE_WEIGHT = 0.1;
const PALETTE_TOKEN_WEIGHT = 0.02;
const CUSTOM_PROPERTY_WEIGHT = 0.3;
const REGULAR_RULE_WEIGHT = 1;
const BRAND_INTENT_BOOST = 50;

interface RawColor {
  hex: Hex;
  oklch: { l: number; c: number; h: number };
  selectors: string[];
  occurrences: number;
  brandIntent: number;
}

interface ColorCluster extends RawColor {}

const COLOR_REGEX =
  /(#(?:[0-9a-fA-F]{3,8}))|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)|oklab\([^)]+\)/g;

// Matches "153.1deg 60.2% 52.7%" or "153.1 60.2% 52.7%" — Tailwind / shadcn
// pattern of declaring HSL components directly in a custom property so the
// consumer can wrap with hsl(var(--x)).
const HSL_COMPONENT_REGEX =
  /^\s*(-?[\d.]+)(?:deg)?[\s,]+(-?[\d.]+)%[\s,]+(-?[\d.]+)%\s*(?:[\s,]+(?:[\d.]+|[\d.]+%))?\s*$/;

const ROOT_LIKE_SELECTOR_REGEX =
  /(^|,)\s*(:root|html|body|\[data-theme[^\]]*\]|\.dark\b|\.light\b)\s*(?=,|$)/i;

const TAILWIND_PALETTE_NAMES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const UTILITY_CLASS_REGEX = new RegExp(
  String.raw`(?:^|[\s>+~,\.\:\[])(?:bg|text|border(?:-[trbl])?|ring(?:-offset)?|outline|fill|stroke|placeholder|caret|decoration|divide|shadow|from|to|via|accent)-(?:${TAILWIND_PALETTE_NAMES}|black|white|transparent|current|inherit)(?:-(?:50|100|200|300|400|500|600|700|800|900|950))?(?:\b|\/|\:|$)`,
  "i"
);

const BRAND_INTENT_NAME_REGEX =
  /^(?:--)?(?:colors?-)?(?:brand|primary|accent|cta|focus|interactive|action|theme|main)(?:-(?:default|base|500|600|main|primary))?$/i;

const SECONDARY_BRAND_INTENT_REGEX =
  /^(?:--)?(?:colors?-)?(?:brand|primary|accent|cta|theme)-/i;

export function extractColors(parsed: ParsedCss): {
  primary: ColorToken[];
  neutral: ColorToken[];
  semantic: ColorToken[];
} {
  const brandHints = collectBrandHints(parsed.customProperties);
  const raw = collectRawColors(parsed, brandHints);
  const clusters = clusterColors(raw);
  const enriched = clusters.map((cluster) => classify(cluster));
  return groupByRole(enriched);
}

interface BrandHint {
  hex: Hex;
  weight: number;
  name: string;
}

function collectBrandHints(props: CssCustomProperty[]): Map<Hex, BrandHint> {
  const map = new Map<Hex, BrandHint>();
  for (const cp of props) {
    if (!cp.value) continue;
    const hex = parseAnyColor(cp.value);
    if (!hex) continue;

    const stripped = cp.name.replace(/^--/, "");
    let weight = 0;
    if (BRAND_INTENT_NAME_REGEX.test(stripped)) {
      weight = BRAND_INTENT_BOOST * 4;
    } else if (SECONDARY_BRAND_INTENT_REGEX.test(stripped)) {
      weight = BRAND_INTENT_BOOST;
    } else {
      continue;
    }

    const existing = map.get(hex);
    if (!existing || weight > existing.weight) {
      map.set(hex, { hex, weight, name: cp.name });
    }
  }
  return map;
}

function parseAnyColor(value: string): Hex | null {
  const trimmed = value.trim();
  const direct = toHex(trimmed);
  if (direct) return direct;

  const fnMatch = trimmed.match(COLOR_REGEX);
  if (fnMatch) {
    const fromFn = toHex(fnMatch[0]);
    if (fromFn) return fromFn;
  }

  const hsl = trimmed.match(HSL_COMPONENT_REGEX);
  if (hsl) {
    const wrapped = `hsl(${hsl[1]}, ${hsl[2]}%, ${hsl[3]}%)`;
    const fromWrapped = toHex(wrapped);
    if (fromWrapped) return fromWrapped;
  }

  return null;
}

function isUtilityClassSelector(selector: string): boolean {
  return UTILITY_CLASS_REGEX.test(selector);
}

function isRootLikeSelector(selector: string): boolean {
  return ROOT_LIKE_SELECTOR_REGEX.test(selector);
}

function declarationWeight(selector: string, property: string): number {
  const isCustomProp = property.startsWith("--");
  if (isCustomProp && isRootLikeSelector(selector)) {
    return PALETTE_TOKEN_WEIGHT;
  }
  if (isCustomProp) {
    return CUSTOM_PROPERTY_WEIGHT;
  }
  if (isUtilityClassSelector(selector)) {
    return UTILITY_RULE_WEIGHT;
  }
  return REGULAR_RULE_WEIGHT;
}

function collectRawColors(
  parsed: ParsedCss,
  brandHints: Map<Hex, BrandHint>
): RawColor[] {
  const map = new Map<Hex, RawColor>();

  const addOccurrence = (hex: Hex, selector: string, weight: number) => {
    const existing = map.get(hex);
    if (existing) {
      map.set(hex, {
        ...existing,
        selectors: [...existing.selectors, selector],
        occurrences: existing.occurrences + weight,
      });
      return;
    }
    const ok = toOklch(parseColor(hex));
    if (!ok) return;
    map.set(hex, {
      hex,
      oklch: { l: ok.l ?? 0, c: ok.c ?? 0, h: ok.h ?? 0 },
      selectors: [selector],
      occurrences: weight,
      brandIntent: brandHints.get(hex)?.weight ?? 0,
    });
  };

  for (const rule of parsed.rules) {
    for (const [property, value] of Object.entries(rule.declarations)) {
      if (!isColorProperty(property) && !property.startsWith("--")) continue;

      const weight = declarationWeight(rule.selector, property);
      const isCustomProp = property.startsWith("--");

      // For custom properties, also try the HSL-component shorthand.
      if (isCustomProp) {
        const synth = parseAnyColor(value);
        if (synth) {
          addOccurrence(synth, rule.selector, weight);
          continue;
        }
      }

      const matches = value.match(COLOR_REGEX);
      if (!matches) continue;

      for (const m of matches) {
        const hex = toHex(m);
        if (!hex) continue;
        addOccurrence(hex, rule.selector, weight);
      }
    }
  }

  return [...map.values()];
}

function toHex(input: string): Hex | null {
  try {
    const parsed = parseColor(input);
    if (!parsed) return null;
    const hex = formatHex(parsed);
    if (!hex) return null;
    return hex as Hex;
  } catch {
    return null;
  }
}

function clusterColors(colors: RawColor[]): ColorCluster[] {
  const sorted = [...colors].sort(
    (a, b) =>
      b.brandIntent + b.occurrences - (a.brandIntent + a.occurrences)
  );
  const clusters: ColorCluster[] = [];

  for (const color of sorted) {
    let bucket: ColorCluster | undefined;
    for (const c of clusters) {
      const d = diff(
        { mode: "oklch", l: color.oklch.l, c: color.oklch.c, h: color.oklch.h },
        { mode: "oklch", l: c.oklch.l, c: c.oklch.c, h: c.oklch.h }
      );
      if (d < CLUSTER_THRESHOLD) {
        bucket = c;
        break;
      }
    }
    if (bucket) {
      bucket.selectors = [...bucket.selectors, ...color.selectors];
      bucket.occurrences += color.occurrences;
      bucket.brandIntent = Math.max(bucket.brandIntent, color.brandIntent);
    } else {
      clusters.push({ ...color });
    }
  }

  return clusters;
}

interface ClassifiedColor {
  hex: Hex;
  oklch: { l: number; c: number; h: number };
  occurrences: number;
  brandIntent: number;
  score: number;
  selectors: string[];
  role: "primary" | "neutral" | "semantic";
  semanticKind?: SemanticKind;
  usage: string;
}

function classify(cluster: ColorCluster): ClassifiedColor {
  const { oklch, selectors, brandIntent } = cluster;
  const isLowChroma = oklch.c < 0.04;
  const isDarkInk = oklch.l < 0.35 && oklch.c < 0.1;
  const isVeryLightOrDark = oklch.l < 0.1 || oklch.l > 0.95 || isDarkInk;

  const hueSemantic = matchSemantic(oklch);
  const contextSemantic = matchSemanticBySelector(selectors);
  const semantic =
    contextSemantic ??
    (hueSemantic && hasSemanticContext(selectors) ? hueSemantic : undefined);
  const usage = inferUsage(selectors);

  let role: "primary" | "neutral" | "semantic";
  if (semantic) {
    role = "semantic";
  } else if (brandIntent > 0) {
    role = "primary";
  } else if (isLowChroma || isVeryLightOrDark) {
    role = "neutral";
  } else {
    role = "primary";
  }

  return {
    hex: cluster.hex,
    oklch: cluster.oklch,
    occurrences: cluster.occurrences,
    brandIntent,
    score: brandIntent + cluster.occurrences,
    selectors: cluster.selectors,
    role,
    semanticKind: semantic,
    usage,
  };
}

const SEMANTIC_CONTEXT_REGEX =
  /(error|danger|destructive|warning|caution|success|positive|info|notification|alert|toast)/i;

function hasSemanticContext(selectors: string[]): boolean {
  return selectors.some((s) => SEMANTIC_CONTEXT_REGEX.test(s));
}

function matchSemanticBySelector(selectors: string[]): SemanticKind | undefined {
  for (const s of selectors) {
    if (/(error|danger|destructive)/i.test(s)) return "error";
    if (/(warning|caution)/i.test(s)) return "warning";
    if (/(success|positive)/i.test(s)) return "success";
    if (/\b(info|notification)\b/i.test(s)) return "info";
  }
  return undefined;
}

function matchSemantic(oklch: {
  l: number;
  c: number;
  h: number;
}): SemanticKind | undefined {
  if (oklch.c < 0.08) return undefined;
  const h = ((oklch.h % 360) + 360) % 360;
  if (h < 40 || h >= 340) return "error";
  if (h >= 40 && h < 100) return "warning";
  if (h >= 120 && h < 210) return "success";
  if (h >= 210 && h < 280) return "info";
  return undefined;
}

function inferUsage(selectors: string[]): string {
  const lower = selectors.map((s) => s.toLowerCase()).join(" ");
  const hits: string[] = [];
  if (/(\bbutton\b|\.btn|\[role=button\]|cta)/.test(lower)) {
    hits.push("buttons");
  }
  if (/(\ba\b\s|link|\.link|nav)/.test(lower)) hits.push("links");
  if (/(headline|heading|h[1-6]\b|title)/.test(lower)) hits.push("headings");
  if (/(body|paragraph|\bp\b\s|text-)/.test(lower)) hits.push("body text");
  if (/(border|divider|outline)/.test(lower)) hits.push("borders");
  if (/(background|bg-|surface)/.test(lower)) hits.push("backgrounds");
  if (/(card|panel)/.test(lower)) hits.push("cards");
  if (/(input|form|field)/.test(lower)) hits.push("form fields");
  if (hits.length === 0) return "general UI";
  return hits.slice(0, 3).join(", ");
}

function groupByRole(items: ClassifiedColor[]): {
  primary: ColorToken[];
  neutral: ColorToken[];
  semantic: ColorToken[];
} {
  const filtered = items.filter(
    (c) => c.brandIntent > 0 || c.occurrences >= 2
  );

  const primary = filtered
    .filter((c) => c.role === "primary")
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((c, i) => toToken(c, "primary", i));

  const neutralRaw = filtered
    .filter((c) => c.role === "neutral")
    .sort((a, b) => a.oklch.l - b.oklch.l)
    .slice(0, 10)
    .map((c, i) => toToken(c, "neutral", i));
  const neutral = ensureUniqueNames(neutralRaw);

  const semantic = filtered
    .filter((c) => c.role === "semantic" && c.semanticKind)
    .sort((a, b) => b.score - a.score);

  const seenSemantic = new Set<SemanticKind>();
  const semanticTokens: ColorToken[] = [];
  for (const c of semantic) {
    if (!c.semanticKind || seenSemantic.has(c.semanticKind)) continue;
    seenSemantic.add(c.semanticKind);
    semanticTokens.push({
      name: `color-${c.semanticKind}`,
      hex: c.hex,
      oklch: c.oklch,
      role: "semantic",
      semanticKind: c.semanticKind,
      usage: semanticUsageLabel(c.semanticKind),
      occurrences: Math.max(1, Math.round(c.occurrences)),
    });
  }

  return { primary, neutral, semantic: semanticTokens };
}

function toToken(
  c: ClassifiedColor,
  role: "primary" | "neutral",
  index: number
): ColorToken {
  const name = role === "primary" ? primaryName(index) : neutralName(c, index);
  return {
    name,
    hex: c.hex,
    oklch: c.oklch,
    role,
    usage: c.usage,
    occurrences: Math.max(1, Math.round(c.occurrences)),
  };
}

function primaryName(index: number): string {
  const names = ["color-brand", "color-accent", "color-secondary"];
  return names[index] ?? `color-primary-${index + 1}`;
}

function neutralName(c: ClassifiedColor, index: number): string {
  const lightness = c.oklch.l;
  if (lightness > 0.95) return "color-surface";
  if (lightness > 0.85) return "color-gray-50";
  if (lightness > 0.75) return "color-gray-100";
  if (lightness > 0.65) return "color-gray-200";
  if (lightness > 0.5) return "color-gray-400";
  if (lightness > 0.35) return "color-gray-600";
  if (lightness > 0.2) return "color-ink";
  return `color-neutral-${index + 1}`;
}

function ensureUniqueNames(tokens: ColorToken[]): ColorToken[] {
  const counts = new Map<string, number>();
  return tokens.map((t) => {
    const seen = counts.get(t.name) ?? 0;
    counts.set(t.name, seen + 1);
    if (seen === 0) return t;
    return { ...t, name: `${t.name}-${seen + 1}` };
  });
}

function semanticUsageLabel(kind: SemanticKind): string {
  switch (kind) {
    case "error":
      return "Error states, destructive actions";
    case "warning":
      return "Warning alerts, cautionary notices";
    case "success":
      return "Success states, positive indicators";
    case "info":
      return "Informational badges, hints";
  }
}
