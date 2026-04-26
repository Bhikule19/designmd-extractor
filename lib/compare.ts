/**
 * Pure compare layer. Takes two ExtractedTokens objects and aligns them so
 * the UI can show "what's unique to A · what's shared · what's unique to B"
 * for every category (colours, typography, spacing, radius, shadows).
 *
 * Matching rules:
 *   - Colours match by perceptual distance (ΔE2000) so #635BFF and #6259FE
 *     are correctly considered the same brand colour across two sites.
 *   - Typography matches by role name (display, h1, body, …).
 *   - Spacing / radius / shadow match by exact pixel value.
 *
 * Everything is read-only and deterministic.
 */

import { converter, differenceCiede2000, parse as parseColor } from "culori";
import type {
  ColorToken,
  ExtractedTokens,
  RadiusToken,
  ScaleToken,
  ShadowToken,
  TypographyRole,
} from "@/lib/types";

const SAME_COLOR_DELTA_E = 5;

const toOklch = converter("oklch");
const diff = differenceCiede2000();

export interface ColorPair {
  a: ColorToken;
  b: ColorToken;
  deltaE: number;
}

export interface ColorDiff {
  aOnly: ColorToken[];
  shared: ColorPair[];
  bOnly: ColorToken[];
}

export interface TypographyPair {
  a: TypographyRole;
  b: TypographyRole;
  deltas: {
    sizePx: number;
    weight: number;
    lineHeight: number;
    sameFamily: boolean;
  };
}

export interface TypographyDiff {
  aOnly: TypographyRole[];
  shared: TypographyPair[];
  bOnly: TypographyRole[];
}

export interface ScaleDiff<T> {
  aOnly: T[];
  shared: { a: T; b: T }[];
  bOnly: T[];
}

export interface ComparisonResult {
  meta: {
    a: { name: string; hostname: string; url: string };
    b: { name: string; hostname: string; url: string };
    fetchedAt: string;
  };
  colors: {
    primary: ColorDiff;
    neutral: ColorDiff;
    semantic: ColorDiff;
  };
  typography: TypographyDiff;
  fonts: { aOnly: string[]; shared: string[]; bOnly: string[] };
  spacing: ScaleDiff<ScaleToken>;
  radius: ScaleDiff<RadiusToken>;
  shadows: ScaleDiff<ShadowToken>;
  summary: {
    colorsTotalA: number;
    colorsTotalB: number;
    colorsShared: number;
    typographyShared: number;
    spacingShared: number;
    radiusShared: number;
  };
}

export function compareTokens(
  a: ExtractedTokens,
  b: ExtractedTokens
): ComparisonResult {
  const colors = {
    primary: diffColors(a.colors.primary, b.colors.primary),
    neutral: diffColors(a.colors.neutral, b.colors.neutral),
    semantic: diffColors(a.colors.semantic, b.colors.semantic),
  };
  const typography = diffTypography(a.typography.roles, b.typography.roles);
  const fonts = diffFonts(
    a.typography.fonts.map((f) => f.family),
    b.typography.fonts.map((f) => f.family)
  );
  const spacing = diffScale(a.spacing, b.spacing, scaleEquals);
  const radius = diffScale(a.radius, b.radius, scaleEquals);
  const shadows = diffShadows(a.shadows, b.shadows);

  return {
    meta: {
      a: {
        name: a.meta.name,
        hostname: a.meta.hostname,
        url: a.meta.url,
      },
      b: {
        name: b.meta.name,
        hostname: b.meta.hostname,
        url: b.meta.url,
      },
      fetchedAt: new Date().toISOString(),
    },
    colors,
    typography,
    fonts,
    spacing,
    radius,
    shadows,
    summary: {
      colorsTotalA:
        a.colors.primary.length +
        a.colors.neutral.length +
        a.colors.semantic.length,
      colorsTotalB:
        b.colors.primary.length +
        b.colors.neutral.length +
        b.colors.semantic.length,
      colorsShared:
        colors.primary.shared.length +
        colors.neutral.shared.length +
        colors.semantic.shared.length,
      typographyShared: typography.shared.length,
      spacingShared: spacing.shared.length,
      radiusShared: radius.shared.length,
    },
  };
}

/* ─── Colours ─── */

function colorDeltaE(x: ColorToken, y: ColorToken): number {
  // Use the precomputed OKLCH if present; fall back to parsing the hex.
  const ox = x.oklch ?? toOklchSafe(x.hex);
  const oy = y.oklch ?? toOklchSafe(y.hex);
  if (!ox || !oy) return Infinity;
  return diff(
    { mode: "oklch", l: ox.l, c: ox.c, h: ox.h },
    { mode: "oklch", l: oy.l, c: oy.c, h: oy.h }
  );
}

function toOklchSafe(
  hex: string
): { l: number; c: number; h: number } | null {
  try {
    const p = toOklch(parseColor(hex));
    if (!p) return null;
    return { l: p.l ?? 0, c: p.c ?? 0, h: p.h ?? 0 };
  } catch {
    return null;
  }
}

export function diffColors(a: ColorToken[], b: ColorToken[]): ColorDiff {
  const matchedB = new Set<number>();
  const shared: ColorPair[] = [];
  const aOnly: ColorToken[] = [];

  for (const ax of a) {
    let bestIndex = -1;
    let bestDelta = SAME_COLOR_DELTA_E;
    for (let i = 0; i < b.length; i++) {
      if (matchedB.has(i)) continue;
      const d = colorDeltaE(ax, b[i]);
      if (d < bestDelta) {
        bestDelta = d;
        bestIndex = i;
      }
    }
    if (bestIndex >= 0) {
      shared.push({ a: ax, b: b[bestIndex], deltaE: bestDelta });
      matchedB.add(bestIndex);
    } else {
      aOnly.push(ax);
    }
  }

  const bOnly = b.filter((_, i) => !matchedB.has(i));
  return { aOnly, shared, bOnly };
}

/* ─── Typography ─── */

function diffTypography(
  a: TypographyRole[],
  b: TypographyRole[]
): TypographyDiff {
  const byRoleA = new Map(a.map((r) => [r.role, r]));
  const byRoleB = new Map(b.map((r) => [r.role, r]));

  const shared: TypographyPair[] = [];
  const aOnly: TypographyRole[] = [];
  const bOnly: TypographyRole[] = [];

  for (const role of byRoleA.keys()) {
    const ra = byRoleA.get(role)!;
    const rb = byRoleB.get(role);
    if (rb) {
      shared.push({
        a: ra,
        b: rb,
        deltas: {
          sizePx: rb.size - ra.size,
          weight: rb.weight - ra.weight,
          lineHeight:
            Math.round((rb.lineHeight - ra.lineHeight) * 100) / 100,
          sameFamily: ra.family.toLowerCase() === rb.family.toLowerCase(),
        },
      });
    } else {
      aOnly.push(ra);
    }
  }

  for (const role of byRoleB.keys()) {
    if (!byRoleA.has(role)) bOnly.push(byRoleB.get(role)!);
  }

  return { aOnly, shared, bOnly };
}

function diffFonts(
  a: string[],
  b: string[]
): { aOnly: string[]; shared: string[]; bOnly: string[] } {
  const norm = (s: string) => s.toLowerCase().trim();
  const setA = new Set(a.map(norm));
  const setB = new Set(b.map(norm));
  const aOnly = a.filter((f) => !setB.has(norm(f)));
  const bOnly = b.filter((f) => !setA.has(norm(f)));
  const shared = a.filter((f) => setB.has(norm(f)));
  return { aOnly, shared, bOnly };
}

/* ─── Generic scales (spacing / radius) ─── */

function scaleEquals(
  a: ScaleToken | RadiusToken,
  b: ScaleToken | RadiusToken
): boolean {
  if (a.unit !== b.unit) return false;
  return Math.abs(a.value - b.value) <= 1; // 1px tolerance
}

function diffScale<T extends { value: number; unit: string }>(
  a: T[],
  b: T[],
  eq: (x: T, y: T) => boolean
): ScaleDiff<T> {
  const matchedB = new Set<number>();
  const shared: { a: T; b: T }[] = [];
  const aOnly: T[] = [];

  for (const ax of a) {
    const idx = b.findIndex((bx, i) => !matchedB.has(i) && eq(ax, bx));
    if (idx >= 0) {
      shared.push({ a: ax, b: b[idx] });
      matchedB.add(idx);
    } else {
      aOnly.push(ax);
    }
  }

  const bOnly = b.filter((_, i) => !matchedB.has(i));
  return { aOnly, shared, bOnly };
}

/* ─── Shadows ─── */

function diffShadows(
  a: ShadowToken[],
  b: ShadowToken[]
): ScaleDiff<ShadowToken> {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const matchedB = new Set<number>();
  const shared: { a: ShadowToken; b: ShadowToken }[] = [];
  const aOnly: ShadowToken[] = [];

  for (const ax of a) {
    const idx = b.findIndex(
      (bx, i) => !matchedB.has(i) && norm(bx.value) === norm(ax.value)
    );
    if (idx >= 0) {
      shared.push({ a: ax, b: b[idx] });
      matchedB.add(idx);
    } else {
      aOnly.push(ax);
    }
  }

  const bOnly = b.filter((_, i) => !matchedB.has(i));
  return { aOnly, shared, bOnly };
}
