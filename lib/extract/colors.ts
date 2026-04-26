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
  type CssRule,
} from "@/lib/extract/css-walker";

const toOklch = converter("oklch");
const diff = differenceCiede2000();
const CLUSTER_THRESHOLD = 2.5;

interface RawColor {
  hex: Hex;
  oklch: { l: number; c: number; h: number };
  selectors: string[];
  occurrences: number;
}

interface ColorCluster extends RawColor {}

const COLOR_REGEX =
  /(#(?:[0-9a-fA-F]{3,8}))|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)|oklab\([^)]+\)/g;

export function extractColors(parsed: ParsedCss): {
  primary: ColorToken[];
  neutral: ColorToken[];
  semantic: ColorToken[];
} {
  const raw = collectRawColors(parsed);
  const clusters = clusterColors(raw);
  const enriched = clusters.map((cluster) => classify(cluster));
  return groupByRole(enriched);
}

function collectRawColors(parsed: ParsedCss): RawColor[] {
  const map = new Map<Hex, RawColor>();

  const addOccurrence = (hex: Hex, selector: string) => {
    const existing = map.get(hex);
    if (existing) {
      map.set(hex, {
        ...existing,
        selectors: [...existing.selectors, selector],
        occurrences: existing.occurrences + 1,
      });
      return;
    }
    const ok = toOklch(parseColor(hex));
    if (!ok) return;
    map.set(hex, {
      hex,
      oklch: { l: ok.l ?? 0, c: ok.c ?? 0, h: ok.h ?? 0 },
      selectors: [selector],
      occurrences: 1,
    });
  };

  for (const rule of parsed.rules) {
    for (const [property, value] of Object.entries(rule.declarations)) {
      if (!isColorProperty(property) && !property.startsWith("--")) continue;

      const matches = value.match(COLOR_REGEX);
      if (!matches) continue;

      for (const m of matches) {
        const hex = toHex(m);
        if (!hex) continue;
        addOccurrence(hex, rule.selector);
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
  const sorted = [...colors].sort((a, b) => b.occurrences - a.occurrences);
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
  selectors: string[];
  role: "primary" | "neutral" | "semantic";
  semanticKind?: SemanticKind;
  usage: string;
}

function classify(cluster: ColorCluster): ClassifiedColor {
  const { oklch, selectors } = cluster;
  const isLowChroma = oklch.c < 0.04;
  const isDarkInk = oklch.l < 0.35 && oklch.c < 0.1;
  const isVeryLightOrDark = oklch.l < 0.1 || oklch.l > 0.95 || isDarkInk;

  const hueSemantic = matchSemantic(oklch);
  const contextSemantic = matchSemanticBySelector(selectors);
  const semantic = contextSemantic ?? (hueSemantic && hasSemanticContext(selectors) ? hueSemantic : undefined);
  const usage = inferUsage(selectors);

  let role: "primary" | "neutral" | "semantic";
  if (semantic) {
    role = "semantic";
  } else if (isLowChroma || isVeryLightOrDark) {
    role = "neutral";
  } else {
    role = "primary";
  }

  return {
    hex: cluster.hex,
    oklch: cluster.oklch,
    occurrences: cluster.occurrences,
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

function matchSemantic(
  oklch: { l: number; c: number; h: number }
): SemanticKind | undefined {
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
  const filtered = items.filter((c) => c.occurrences >= 2);

  const primary = filtered
    .filter((c) => c.role === "primary")
    .sort((a, b) => b.occurrences - a.occurrences)
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
    .sort((a, b) => b.occurrences - a.occurrences);

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
      occurrences: c.occurrences,
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
    occurrences: c.occurrences,
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
