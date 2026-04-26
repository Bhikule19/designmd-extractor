import { converter, formatHex, parse as parseColor } from "culori";
import type { Hex } from "@/lib/types";
import { type FetchedSite, resolveUrl } from "@/lib/extract/fetch";

export interface HeadBrandSignal {
  hex: Hex;
  weight: number;
  /** Human-readable origin for debugging / `name` field on the BrandHint. */
  source: string;
}

const FETCH_TIMEOUT_MS = 5_000;

const toOklch = converter("oklch");

function toHex(input: string): Hex | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const parsed = parseColor(trimmed);
    if (!parsed) return null;
    const hex = formatHex(parsed);
    if (!hex) return null;
    return hex as Hex;
  } catch {
    return null;
  }
}

/**
 * Read brand-intent colour declarations from the `<head>` and from the site's
 * web app manifest. These are the closest thing to a self-declared brand hex
 * — sites set them so phones / browsers paint the right colour on the
 * address bar and home-screen icon. Every signal here gets a strong brand
 * weight, matching `--brand` custom property detection.
 */
export async function collectHeadBrandSignals(
  site: FetchedSite
): Promise<HeadBrandSignal[]> {
  const out: HeadBrandSignal[] = [];
  const $ = site.$;

  // <meta name="theme-color">
  $('meta[name="theme-color"]').each((_, el) => {
    const value = $(el).attr("content");
    if (!value) return;
    const hex = toHex(value);
    if (!hex) return;
    out.push({ hex, weight: 240, source: "meta[name=theme-color]" });
  });

  // <meta name="msapplication-TileColor"> (Microsoft tile colour, often the brand)
  $('meta[name="msapplication-TileColor" i]').each((_, el) => {
    const value = $(el).attr("content");
    if (!value) return;
    const hex = toHex(value);
    if (!hex) return;
    out.push({ hex, weight: 160, source: "meta[name=msapplication-TileColor]" });
  });

  // <meta name="apple-mobile-web-app-status-bar-style"> — usually black/translucent, skip
  // <meta name="color-scheme"> — light/dark hint, skip

  // <link rel="manifest"> → /manifest.json
  const manifestHref = $('link[rel="manifest"]').first().attr("href");
  if (manifestHref) {
    const manifestUrl = resolveUrl(manifestHref, site.finalUrl);
    const manifest = await fetchManifest(manifestUrl);
    if (manifest) {
      const themeColor = toHex(manifest.theme_color ?? "");
      if (themeColor) {
        out.push({
          hex: themeColor,
          weight: 220,
          source: "manifest.theme_color",
        });
      }
      const bgColor = toHex(manifest.background_color ?? "");
      if (bgColor && !isNearGrayscale(bgColor)) {
        out.push({
          hex: bgColor,
          weight: 100,
          source: "manifest.background_color",
        });
      }
    }
  }

  return out;
}

interface PartialManifest {
  theme_color?: string;
  background_color?: string;
}

async function fetchManifest(url: string): Promise<PartialManifest | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "application/manifest+json, application/json" },
    });
    if (!r.ok) return null;
    const text = await r.text();
    return JSON.parse(text) as PartialManifest;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isNearGrayscale(hex: Hex): boolean {
  try {
    const ok = toOklch(parseColor(hex));
    if (!ok) return false;
    return (ok.c ?? 0) < 0.04;
  } catch {
    return false;
  }
}
