import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (compatible; DesignMDExtractor/0.1; +https://github.com/) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_CSS_BYTES = 2_000_000;
const MAX_STYLESHEETS = 20;

export interface FetchedSite {
  finalUrl: string;
  hostname: string;
  html: string;
  $: cheerio.CheerioAPI;
  css: string;
  stylesheetCount: number;
  htmlBytes: number;
  cssBytes: number;
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSite(rawUrl: string): Promise<FetchedSite> {
  const url = normaliseUrl(rawUrl);

  const htmlResponse = await fetchWithTimeout(url);
  if (!htmlResponse.ok) {
    throw new Error(
      `Failed to fetch ${url}: HTTP ${htmlResponse.status}`
    );
  }
  const html = await htmlResponse.text();
  const finalUrl = htmlResponse.url || url;
  const hostname = new URL(finalUrl).hostname;
  const $ = cheerio.load(html);

  const inlineStyles = $("style")
    .map((_, el) => $(el).text())
    .get()
    .join("\n");

  const linkHrefs = $('link[rel~="stylesheet"]')
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((h): h is string => !!h)
    .slice(0, MAX_STYLESHEETS)
    .map((href) => resolveUrl(href, finalUrl));

  const cssChunks = await Promise.allSettled(
    linkHrefs.map(async (href) => {
      const r = await fetchWithTimeout(href);
      if (!r.ok) return "";
      return await r.text();
    })
  );

  const fetchedCss = cssChunks
    .map((c) => (c.status === "fulfilled" ? c.value : ""))
    .join("\n");

  let css = `${inlineStyles}\n${fetchedCss}`;
  if (css.length > MAX_CSS_BYTES) {
    css = css.slice(0, MAX_CSS_BYTES);
  }

  return {
    finalUrl,
    hostname,
    html,
    $,
    css,
    stylesheetCount: linkHrefs.length + ($("style").length > 0 ? 1 : 0),
    htmlBytes: html.length,
    cssBytes: css.length,
  };
}

export function normaliseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
