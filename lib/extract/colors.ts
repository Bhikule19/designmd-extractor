import {
  converter,
  differenceCiede2000,
  formatHex,
  parse as parseColor,
} from "culori";
import type {
  ColorToken,
  Hex,
  ProvenanceEntry,
  SemanticKind,
} from "@/lib/types";
import {
  isColorProperty,
  type ParsedCss,
  type CssCustomProperty,
} from "@/lib/extract/css-walker";
import { selectorClasses } from "@/lib/extract/dom-classes";

const toOklch = converter("oklch");
const diff = differenceCiede2000();
const CLUSTER_THRESHOLD = 2.5;

const UTILITY_RULE_WEIGHT = 0.1;
const PALETTE_TOKEN_WEIGHT = 0.02;
const CUSTOM_PROPERTY_WEIGHT = 0.3;
const REGULAR_RULE_WEIGHT = 1;
const FRAMEWORK_RULE_WEIGHT = 0.01;
const BRAND_INTENT_BOOST = 50;

// Class-allowlist multipliers — applied on top of the base rule weight when
// we know which classes appear in the served HTML. The gradient is steep on
// purpose: a class that never appears in `class="..."` is almost certainly
// a framework leftover or unused theme variant, while a class actually
// rendered on the page is direct evidence the rule is part of the visible
// design language.
const CLASS_USED_MULTIPLIER = 4.0;
const CLASS_UNUSED_MULTIPLIER = 0.01;

interface RawProvenance {
  selector: string;
  property: string;
  weight: number;
}

interface RawColor {
  hex: Hex;
  oklch: { l: number; c: number; h: number };
  selectors: string[];
  occurrences: number;
  brandIntent: number;
  provenance: RawProvenance[];
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

// WordPress / page-builder / e-commerce CSS that ships with the public site
// but isn't part of the visible design language. Demote these to framework
// noise so they don't dominate frequency counts.
const FRAMEWORK_NOISE_SELECTOR_REGEX =
  /\b(?:wp-admin|wp-block-|wp-element-|wp-image-|wp-embed|wp-caption|wp-paragraph|wp-heading|wp-buttons?|wp-list|wp-table|wp-quote|wp-pullquote|wp-code|wp-preformatted|wp-verse|wp-spacer|wp-separator|wp-group|wp-columns?|wp-cover|wp-media-text|wp-search|wp-archives|wp-categories|wp-page-list|wp-post|wp-comment|wp-tag-cloud|wp-shortcode|wp-html|wp-classic|wp-latest|wp-loginout|wp-meta|wp-rss|wp-social|wp-site|wp-template|wp-query|wp-pattern|wp-navigation|wp-mediaelement|editor-styles?-wrapper|edit-post|block-editor|gutenberg|tinymce|mce-|uagb-|spectra|elementor|wpforms|wc-block|woocommerce|woopay|gform|nf-|caldera|gravity|astra-|ast-|fl-builder|fl-bb|et_pb|divi-|brizy|breakdance|kadence|generatepress|ocean-?wp|neve-|hello-|twentytwenty|twentytwentyone|twentytwentytwo|twentytwentythree|twentytwentyfour)/i;

const TAILWIND_PALETTE_NAMES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const UTILITY_CLASS_REGEX = new RegExp(
  String.raw`(?:^|[\s>+~,\.\:\[])(?:bg|text|border(?:-[trbl])?|ring(?:-offset)?|outline|fill|stroke|placeholder|caret|decoration|divide|shadow|from|to|via|accent)-(?:${TAILWIND_PALETTE_NAMES}|black|white|transparent|current|inherit)(?:-(?:50|100|200|300|400|500|600|700|800|900|950))?(?:\b|\/|\:|$)`,
  "i"
);

const BRAND_KEYWORDS = [
  "brand",
  "primary",
  "accent",
  "cta",
  "focus",
  "interactive",
  "action",
  "theme",
  "main",
] as const;

const BRAND_SCALE_SUFFIX = new Set([
  "default",
  "base",
  "main",
  "500",
  "600",
  "primary",
]);

export interface ExtractColorsOptions {
  /** Class names actually present in `class="..."` attributes on the page. */
  domClasses?: Set<string>;
  /** Hex codes the site's `<head>` declared as brand intent (theme-color, manifest, og). */
  externalBrandHints?: Map<Hex, { weight: number; name: string }>;
}

export function extractColors(
  parsed: ParsedCss,
  options: ExtractColorsOptions = {}
): {
  primary: ColorToken[];
  neutral: ColorToken[];
  semantic: ColorToken[];
} {
  const brandHints = collectBrandHints(parsed.customProperties);
  if (options.externalBrandHints) {
    for (const [hex, hint] of options.externalBrandHints) {
      const existing = brandHints.get(hex);
      if (!existing || hint.weight > existing.weight) {
        brandHints.set(hex, { hex, weight: hint.weight, name: hint.name });
      }
    }
  }
  const raw = collectRawColors(parsed, brandHints, options.domClasses);
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
  const valueByName = new Map<string, string>();
  for (const cp of props) valueByName.set(cp.name, cp.value);

  for (const cp of props) {
    if (!cp.value) continue;

    const weight = brandIntentScore(cp.name);
    if (weight === 0) continue;

    if (isFrameworkNoiseCustomPropertyName(cp.name)) continue;

    const resolvedValue = resolveCustomPropertyVar(cp.value, valueByName);
    const hex = parseAnyColor(resolvedValue);
    if (!hex) continue;

    const existing = map.get(hex);
    if (!existing || weight > existing.weight) {
      map.set(hex, { hex, weight, name: cp.name });
    }
  }
  return map;
}

function resolveCustomPropertyVar(
  value: string,
  vars: Map<string, string>,
  depth = 0
): string {
  if (depth > 8) return value;
  return value.replace(
    /var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,\s*([^)]+))?\)/g,
    (_, name: string, fallback: string | undefined) => {
      const next = vars.get(name);
      if (next) return resolveCustomPropertyVar(next, vars, depth + 1);
      if (fallback) return fallback.trim();
      return "";
    }
  );
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

export function isFrameworkNoiseSelector(selector: string): boolean {
  return FRAMEWORK_NOISE_SELECTOR_REGEX.test(selector);
}

function isFrameworkNoiseCustomPropertyName(name: string): boolean {
  // Internal framework variables that never represent the visible brand.
  // Note: theme-builder variables like --ast-global-color-N or --et-builder-*
  // OFTEN house the actual brand colour, so we don't treat them as noise.
  return /^--(?:wp-admin|wp-block|wp-element|gutenberg|editor-|mce-|tw-|tinymce-)/i.test(
    name
  );
}

function brandIntentScore(name: string): number {
  const tokens = name
    .replace(/^--/, "")
    .toLowerCase()
    .split(/[-_]/)
    .filter(Boolean);
  if (tokens.length === 0) return 0;

  const last = tokens[tokens.length - 1];
  const secondLast = tokens[tokens.length - 2];

  if ((BRAND_KEYWORDS as readonly string[]).includes(last)) {
    return BRAND_INTENT_BOOST * 4;
  }

  if (
    secondLast &&
    (BRAND_KEYWORDS as readonly string[]).includes(secondLast) &&
    BRAND_SCALE_SUFFIX.has(last)
  ) {
    return BRAND_INTENT_BOOST * 4;
  }

  if (tokens.some((t) => (BRAND_KEYWORDS as readonly string[]).includes(t))) {
    return BRAND_INTENT_BOOST;
  }

  return 0;
}

function classMembershipMultiplier(
  selector: string,
  domClasses: Set<string> | undefined
): number {
  if (!domClasses || domClasses.size === 0) return 1;
  const classes = selectorClasses(selector);
  if (classes.length === 0) return 1; // element-only selector — no DOM signal
  return classes.some((c) => domClasses.has(c))
    ? CLASS_USED_MULTIPLIER
    : CLASS_UNUSED_MULTIPLIER;
}

function declarationWeight(
  selector: string,
  property: string,
  domClasses: Set<string> | undefined
): number {
  const isCustomProp = property.startsWith("--");
  if (isCustomProp && isFrameworkNoiseCustomPropertyName(property)) {
    return PALETTE_TOKEN_WEIGHT;
  }
  if (isFrameworkNoiseSelector(selector)) {
    return FRAMEWORK_RULE_WEIGHT;
  }
  if (isCustomProp && isRootLikeSelector(selector)) {
    return PALETTE_TOKEN_WEIGHT;
  }
  if (isCustomProp) {
    return CUSTOM_PROPERTY_WEIGHT;
  }
  const classMul = classMembershipMultiplier(selector, domClasses);
  if (isUtilityClassSelector(selector)) {
    return UTILITY_RULE_WEIGHT * classMul;
  }
  return REGULAR_RULE_WEIGHT * classMul;
}

function collectRawColors(
  parsed: ParsedCss,
  brandHints: Map<Hex, BrandHint>,
  domClasses: Set<string> | undefined
): RawColor[] {
  const map = new Map<Hex, RawColor>();

  const addOccurrence = (
    hex: Hex,
    selector: string,
    property: string,
    weight: number
  ) => {
    const existing = map.get(hex);
    if (existing) {
      map.set(hex, {
        ...existing,
        selectors: [...existing.selectors, selector],
        occurrences: existing.occurrences + weight,
        provenance: [
          ...existing.provenance,
          { selector, property, weight },
        ],
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
      provenance: [{ selector, property, weight }],
    });
  };

  for (const rule of parsed.rules) {
    for (const [property, value] of Object.entries(rule.declarations)) {
      if (!isColorProperty(property) && !property.startsWith("--")) continue;

      const weight = declarationWeight(rule.selector, property, domClasses);
      const isCustomProp = property.startsWith("--");

      // For custom properties, also try the HSL-component shorthand.
      if (isCustomProp) {
        const synth = parseAnyColor(value);
        if (synth) {
          addOccurrence(synth, rule.selector, property, weight);
          continue;
        }
      }

      const matches = value.match(COLOR_REGEX);
      if (!matches) continue;

      for (const m of matches) {
        const hex = toHex(m);
        if (!hex) continue;
        addOccurrence(hex, rule.selector, property, weight);
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
      bucket.provenance = [...bucket.provenance, ...color.provenance];
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
  provenance: RawProvenance[];
}

function classify(cluster: ColorCluster): ClassifiedColor {
  const { oklch, selectors, brandIntent } = cluster;
  const isLowChroma = oklch.c < 0.04;
  const isDarkInk = oklch.l < 0.35 && oklch.c < 0.1;
  const isVeryLightOrDark = oklch.l < 0.1 || oklch.l > 0.95 || isDarkInk;

  const hueSemantic = matchSemantic(oklch);
  const contextSemantic = matchSemanticBySelector(selectors);
  const rawSemantic =
    contextSemantic ??
    (hueSemantic && hasSemanticContext(selectors) ? hueSemantic : undefined);
  // Grayscale/near-grayscale colours are never genuinely "error / warning /
  // success / info" tokens — even if they appear in a selector containing one
  // of those keywords (.info-banner with text-color: black is a common false
  // positive). Require visible chroma to accept a semantic classification.
  const semantic = rawSemantic && oklch.c >= 0.08 ? rawSemantic : undefined;
  const usage = inferUsage(selectors);

  let role: "primary" | "neutral" | "semantic";
  if (semantic) {
    role = "semantic";
  } else if (brandIntent > 0 && !isLowChroma) {
    role = "primary";
  } else if (brandIntent > 0 && isLowChroma) {
    // Brand-intent custom property pointing at a near-grayscale colour
    // (e.g. Astra --ast-global-color-primary → #181818) — surface it as the
    // primary text colour but in the neutral palette where it visually belongs.
    role = "neutral";
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
    provenance: cluster.provenance,
  };
}

const MAX_SELECTOR_DISPLAY = 240;
const PROVENANCE_TOP_N = 6;

/**
 * Reduce a cluster's full provenance list (often hundreds of entries on a
 * heavy palette) to the top-N most-cited unique selector+property pairs.
 * Truncate selectors that are unreasonably long so the modal stays readable.
 */
function topProvenance(raw: RawProvenance[]): ProvenanceEntry[] {
  const buckets = new Map<string, ProvenanceEntry>();
  for (const r of raw) {
    const key = `${r.selector} ${r.property}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.weight += r.weight;
      continue;
    }
    buckets.set(key, {
      selector:
        r.selector.length > MAX_SELECTOR_DISPLAY
          ? r.selector.slice(0, MAX_SELECTOR_DISPLAY) + "…"
          : r.selector,
      property: r.property,
      weight: r.weight,
    });
  }
  return [...buckets.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, PROVENANCE_TOP_N);
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
      provenance: topProvenance(c.provenance),
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
    provenance: topProvenance(c.provenance),
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
