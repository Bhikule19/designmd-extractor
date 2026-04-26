import type { ExtractedTokens, ExtractionResult } from "@/lib/types";
import { fetchSite } from "@/lib/extract/fetch";
import { parseCss } from "@/lib/extract/css-walker";
import { extractColors } from "@/lib/extract/colors";
import { extractTypography } from "@/lib/extract/typography";
import { extractSpacing } from "@/lib/extract/spacing";
import { extractRadius } from "@/lib/extract/radius";
import { extractShadows } from "@/lib/extract/shadows";
import { extractComponents } from "@/lib/extract/components";
import { extractAssets, extractMeta } from "@/lib/extract/assets";

export async function extract(rawUrl: string): Promise<ExtractionResult> {
  let site;
  try {
    site = await fetchSite(rawUrl);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        error: { code: "TIMEOUT", message: "Request timed out", url: rawUrl },
      };
    }
    return {
      ok: false,
      error: {
        code: "FETCH_FAILED",
        message: err instanceof Error ? err.message : "Unknown fetch error",
        url: rawUrl,
      },
    };
  }

  if (!site.css || site.css.length < 100) {
    return {
      ok: false,
      error: {
        code: "NO_CSS_FOUND",
        message:
          "This page does not expose any usable CSS in the static HTML. It may be rendered entirely client-side. Try V2 (Playwright fallback) when available.",
        url: site.finalUrl,
      },
    };
  }

  const warnings: string[] = [];
  const parsed = parseCss(site.css);

  const colors = extractColors(parsed);
  const typography = extractTypography(parsed);
  const spacing = extractSpacing(parsed);
  const radius = extractRadius(parsed);
  const shadows = extractShadows(parsed);
  const components = extractComponents(parsed);
  const assets = extractAssets(site);
  const meta = extractMeta(site);

  if (colors.primary.length === 0) {
    warnings.push(
      "No primary brand colour detected — site may use only neutrals."
    );
  }
  if (typography.fonts.length === 0) {
    warnings.push("No font families detected in CSS rules.");
  }

  const tokens: ExtractedTokens = {
    meta,
    colors,
    typography,
    spacing,
    radius,
    shadows,
    components,
    assets,
    diagnostics: {
      htmlBytes: site.htmlBytes,
      cssBytes: site.cssBytes,
      stylesheetCount: site.stylesheetCount,
      cssCustomPropertyCount: parsed.customProperties.length,
      warnings,
    },
  };

  return { ok: true, tokens };
}
