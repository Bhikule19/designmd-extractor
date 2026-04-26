import type { FontStack, Typography, TypographyRole } from "@/lib/types";
import type { ParsedCss } from "@/lib/extract/css-walker";

const ROLE_SELECTORS: Array<{
  role: TypographyRole["role"];
  selectorTest: (s: string) => boolean;
}> = [
  { role: "display", selectorTest: (s) => /\.display\b|\.hero/.test(s) },
  { role: "h1", selectorTest: (s) => /(^|[\s,>+~])h1(\b|\s|,|$)/.test(s) },
  { role: "h2", selectorTest: (s) => /(^|[\s,>+~])h2(\b|\s|,|$)/.test(s) },
  { role: "h3", selectorTest: (s) => /(^|[\s,>+~])h3(\b|\s|,|$)/.test(s) },
  { role: "h4", selectorTest: (s) => /(^|[\s,>+~])h4(\b|\s|,|$)/.test(s) },
  {
    role: "body",
    selectorTest: (s) =>
      /(^|[\s,>+~])body(\b|,|$)|(^|[\s,>+~])p(\b|\s|,|$)/.test(s),
  },
  {
    role: "small",
    selectorTest: (s) => /\.small\b|\.text-sm|\.text-small/.test(s),
  },
  {
    role: "caption",
    selectorTest: (s) => /\.caption\b|\.text-xs|\.label/.test(s),
  },
  {
    role: "code",
    selectorTest: (s) => /(^|[\s,>+~])code(\b|\s|,|$)|\bpre\b|\.mono/.test(s),
  },
];

export function extractTypography(parsed: ParsedCss): Typography {
  const fontVars = collectFontCustomProperties(parsed);
  const fonts = extractFontStacks(parsed, fontVars);
  const roles = extractRoles(parsed, fonts, fontVars);
  return { fonts, roles };
}

function collectFontCustomProperties(parsed: ParsedCss): Map<string, string> {
  const map = new Map<string, string>();
  for (const cp of parsed.customProperties) {
    if (/font|family/i.test(cp.name)) {
      map.set(cp.name, cp.value);
    }
  }
  return map;
}

function resolveVar(
  value: string,
  vars: Map<string, string>,
  depth = 0
): string {
  if (depth > 4) return value;
  return value.replace(
    /var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,\s*([^)]+))?\)/g,
    (_, name: string, fallback: string | undefined) => {
      const resolved = vars.get(name);
      if (resolved) return resolveVar(resolved, vars, depth + 1);
      if (fallback) return fallback.trim();
      return "";
    }
  );
}

interface ScoredFont {
  stack: FontStack;
  score: number;
}

function selectorWeight(selector: string): number {
  const s = selector.toLowerCase();
  if (/^\s*(:root|html|body)\s*$/.test(s)) return 100;
  if (/(^|[\s,>+~])(html|body)(\b|,|$)/.test(s)) return 80;
  if (/(^|[\s,>+~])h[1-6](\b|,|$)/.test(s)) return 40;
  if (/(^|[\s,>+~])p(\b|\s|,|$)/.test(s)) return 20;
  if (/(button|input|select|textarea|legend|fieldset|optgroup)/.test(s)) {
    return 1;
  }
  return 5;
}

function isMonoFamily(name: string): boolean {
  return /(mono|code|courier|console|menlo|consolas|jetbrains|fira)/i.test(name);
}

function extractFontStacks(
  parsed: ParsedCss,
  fontVars: Map<string, string>
): FontStack[] {
  const scored = new Map<string, ScoredFont>();

  // Custom-property declared font intent gets highest priority
  for (const cp of parsed.customProperties) {
    if (!/font|family/i.test(cp.name)) continue;
    if (!/(brand|primary|default|sans|body|heading|display|mono|family)/i.test(cp.name)) {
      continue;
    }
    const resolved = resolveVar(cp.value, fontVars);
    const stack = parseFontFamily(resolved);
    if (!stack) continue;
    const key = stack.family.toLowerCase();
    const boost = /brand|default|primary|sans|body/i.test(cp.name) ? 200 : 60;
    const existing = scored.get(key);
    if (!existing || boost > existing.score) {
      scored.set(key, { stack, score: boost });
    }
  }

  for (const rule of parsed.rules) {
    const ff = rule.declarations["font-family"];
    if (!ff) continue;
    const resolved = resolveVar(ff, fontVars);
    const stack = parseFontFamily(resolved);
    if (!stack) continue;
    const key = stack.family.toLowerCase();
    const weight = selectorWeight(rule.selector);
    const existing = scored.get(key);
    if (existing) {
      existing.score += weight;
    } else {
      scored.set(key, { stack, score: weight });
    }
  }

  const sorted = [...scored.values()].sort((a, b) => b.score - a.score);

  // Ensure primary text font comes first (non-mono), mono fonts after
  const textFonts = sorted.filter((s) => !isMonoFamily(s.stack.family));
  const monoFonts = sorted.filter((s) => isMonoFamily(s.stack.family));

  return [...textFonts, ...monoFonts]
    .slice(0, 4)
    .map((s) => s.stack);
}

function parseFontFamily(value: string): FontStack | null {
  const cleaned = value
    .split(",")
    .map((s) =>
      s
        .trim()
        .replace(/^['"]/, "")
        .replace(/['"]$/, "")
        .replace(/\)$/, "")
        .trim()
    )
    .filter(
      (s) => s.length > 0 && !s.startsWith("<") && !s.startsWith("var(")
    );
  if (cleaned.length === 0) return null;
  const [primary, ...fallbacks] = cleaned;
  if (!primary || isGenericFamily(primary)) return null;
  return {
    family: primary,
    fallbacks,
    source: "unknown",
  };
}

function isGenericFamily(name: string): boolean {
  return [
    "sans-serif",
    "serif",
    "monospace",
    "system-ui",
    "ui-sans-serif",
    "ui-serif",
    "ui-monospace",
    "ui-rounded",
    "cursive",
    "fantasy",
    "inherit",
    "initial",
    "unset",
  ].includes(name.toLowerCase());
}

function extractRoles(
  parsed: ParsedCss,
  fonts: FontStack[],
  fontVars: Map<string, string>
): TypographyRole[] {
  const defaultFont = fonts[0]?.family ?? "system-ui";
  const monoFont =
    fonts.find((f) => /mono|code/i.test(f.family))?.family ?? "ui-monospace";

  const collected = new Map<TypographyRole["role"], TypographyRole>();

  for (const rule of parsed.rules) {
    for (const { role, selectorTest } of ROLE_SELECTORS) {
      if (!selectorTest(rule.selector)) continue;
      const sample = readTypographyDeclarations(
        rule,
        role === "code" ? monoFont : defaultFont,
        fontVars
      );
      if (!sample) continue;
      if (!collected.has(role)) {
        collected.set(role, { role, ...sample });
      }
    }
  }

  return [...collected.values()];
}

function readTypographyDeclarations(
  rule: { declarations: Record<string, string> },
  fallbackFamily: string,
  fontVars: Map<string, string>
): Omit<TypographyRole, "role"> | null {
  const ff = rule.declarations["font-family"];
  const resolvedFf = ff ? resolveVar(ff, fontVars) : "";
  const family = resolvedFf
    ? parseFontFamily(resolvedFf)?.family ?? fallbackFamily
    : fallbackFamily;
  const sizeRaw = rule.declarations["font-size"];
  if (!sizeRaw) return null;
  const size = parseLengthToPx(sizeRaw);
  if (size === null) return null;
  const weight = parseWeight(rule.declarations["font-weight"]);
  const lineHeight = parseLineHeight(rule.declarations["line-height"], size);
  const letterSpacing = parseLengthToPx(
    rule.declarations["letter-spacing"] ?? ""
  );

  return {
    family,
    size,
    weight,
    lineHeight,
    ...(letterSpacing !== null ? { letterSpacing } : {}),
  };
}

export function parseLengthToPx(input: string): number | null {
  const value = input.trim();
  if (!value) return null;
  const match = value.match(/^(-?\d*\.?\d+)\s*(px|rem|em|pt|%)?$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = (match[2] ?? "px").toLowerCase();
  if (Number.isNaN(num)) return null;
  switch (unit) {
    case "px":
      return num;
    case "rem":
    case "em":
      return num * 16;
    case "pt":
      return num * (96 / 72);
    case "%":
      return null;
    default:
      return num;
  }
}

function parseWeight(input?: string): number {
  if (!input) return 400;
  const trimmed = input.trim();
  const named: Record<string, number> = {
    thin: 100,
    "extra-light": 200,
    light: 300,
    normal: 400,
    medium: 500,
    "semi-bold": 600,
    semibold: 600,
    bold: 700,
    "extra-bold": 800,
    black: 900,
  };
  if (named[trimmed.toLowerCase()]) return named[trimmed.toLowerCase()];
  const num = parseInt(trimmed, 10);
  return Number.isFinite(num) ? num : 400;
}

function parseLineHeight(input: string | undefined, fontSize: number): number {
  if (!input) return 1.5;
  const trimmed = input.trim();
  if (/^[0-9.]+$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    return Number.isFinite(num) ? num : 1.5;
  }
  const px = parseLengthToPx(trimmed);
  if (px && fontSize > 0) {
    return Math.round((px / fontSize) * 100) / 100;
  }
  return 1.5;
}
