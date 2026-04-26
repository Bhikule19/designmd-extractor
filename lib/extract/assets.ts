import type { Assets, SiteMeta } from "@/lib/types";
import type { FetchedSite } from "@/lib/extract/fetch";
import { resolveUrl } from "@/lib/extract/fetch";

export function extractAssets(site: FetchedSite): Assets {
  const { $, finalUrl } = site;

  const faviconHref =
    $('link[rel~="icon"][href]').first().attr("href") ??
    $('link[rel="shortcut icon"][href]').first().attr("href") ??
    $('link[rel~="apple-touch-icon"][href]').first().attr("href");

  const ogImage = $('meta[property="og:image"]').attr("content");

  const fontHrefs = $(
    'link[href*="fonts.googleapis.com"], link[href*="fonts.bunny.net"], link[href*="typekit.net"], link[href*="rsms.me"]'
  )
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((href): href is string => Boolean(href))
    .map((href) => resolveUrl(href, finalUrl));

  return {
    faviconUrl: faviconHref ? resolveUrl(faviconHref, finalUrl) : undefined,
    ogImageUrl: ogImage ? resolveUrl(ogImage, finalUrl) : undefined,
    fontHrefs: [...new Set(fontHrefs)],
  };
}

export function extractMeta(site: FetchedSite): SiteMeta {
  const { $, finalUrl, hostname } = site;

  const tagline =
    $('meta[name="description"]').attr("content")?.trim() ??
    $('meta[property="og:description"]').attr("content")?.trim() ??
    "";

  const name = readSiteName($, hostname);

  return {
    url: finalUrl,
    hostname,
    name,
    tagline,
    fetchedAt: new Date().toISOString(),
  };
}

function readSiteName(
  $: FetchedSite["$"],
  hostname: string
): string {
  const candidates = [
    $('meta[property="og:site_name"]').attr("content")?.trim(),
    $('meta[name="apple-mobile-web-app-title"]').attr("content")?.trim(),
    $('meta[property="og:title"]').attr("content")?.trim(),
    $("title").first().text()?.trim(),
  ].filter((v): v is string => Boolean(v));

  for (const candidate of candidates) {
    const trimmed = trimSiteName(candidate);
    if (trimmed) return trimmed;
  }

  return hostname.replace(/^www\./, "").split(".")[0];
}

function trimSiteName(raw: string): string | null {
  // Cut at the first separator: en-dash, em-dash, pipe, hyphen-with-spaces, colon
  const parts = raw.split(/\s+[–—|:]\s+|\s+-\s+/);
  const first = parts[0]?.trim();
  if (!first) return null;
  if (first.length > 60) return first.slice(0, 60).trim();
  return first;
}
