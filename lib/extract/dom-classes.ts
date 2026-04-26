import type { FetchedSite } from "@/lib/extract/fetch";

/**
 * Walk the served HTML and collect every class name that appears in a
 * `class="..."` attribute. We use this set to weight CSS rules: rules that
 * target a class actually present in the DOM count for more, rules that
 * target unused classes count for almost nothing. This is the cheap,
 * deterministic version of "compute styles on rendered elements" — no
 * headless browser required.
 */
export function collectUsedClasses(site: FetchedSite): Set<string> {
  const used = new Set<string>();
  const $ = site.$;
  $("[class]").each((_, el) => {
    const raw = $(el).attr("class");
    if (!raw) return;
    for (const token of raw.split(/\s+/)) {
      if (token) used.add(token);
    }
  });
  return used;
}

/**
 * Pull plain class names out of a CSS selector string. Handles compound
 * selectors (`.a.b`), combinators (`> + ~`), pseudo states (`:hover`),
 * pseudo elements (`::before`), and Tailwind-style escaped brackets
 * (`.from-\\[\\#3ECF8E\\]`). Returns the bare class names — no leading
 * dot, no pseudo suffix.
 */
export function selectorClasses(selector: string): string[] {
  const out: string[] = [];
  // Strip Tailwind escaped brackets so they don't pollute class detection.
  const cleaned = selector.replace(/\\[[^\]]*]/g, "").replace(/\\#/g, "#");
  const re = /\.([a-zA-Z_-][\w-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    out.push(m[1]);
  }
  return out;
}
