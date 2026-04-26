import type { ButtonSpec, ComponentSpecs } from "@/lib/types";
import type { CssRule, ParsedCss } from "@/lib/extract/css-walker";

export function extractComponents(parsed: ParsedCss): ComponentSpecs {
  return {
    buttons: extractButtons(parsed),
    input: extractInput(parsed),
    card: extractCard(parsed),
    navigation: extractNavigation(parsed),
  };
}

function extractButtons(parsed: ParsedCss): ButtonSpec[] {
  const candidates = parsed.rules.filter((r) =>
    /(^|[\s,>+~])button(\b|\s|,|$)|\.btn(\b|-)|\[role=button\]/.test(r.selector)
  );

  const primary = pickButton(candidates, "primary");
  const secondary = pickButton(candidates, "secondary");
  const ghost = pickButton(candidates, "ghost");

  return [primary, secondary, ghost].filter((b): b is ButtonSpec => b !== null);
}

function pickButton(
  rules: CssRule[],
  variant: "primary" | "secondary" | "ghost"
): ButtonSpec | null {
  const matchers: Record<typeof variant, RegExp> = {
    primary: /(primary|cta|main|filled|solid)/i,
    secondary: /(secondary|outline)/i,
    ghost: /(ghost|tertiary|text|link)/i,
  };

  const match = rules.find((r) => matchers[variant].test(r.selector));
  const fallback = rules.find(
    (r) => /(^|[\s,>+~])button(\b|\s|,|$)/.test(r.selector) && !/[:.]/.test(r.selector.split(",")[0]?.trim() ?? "")
  );

  const source = match ?? (variant === "primary" ? fallback : null);
  if (!source) return null;

  return {
    variant,
    background:
      source.declarations["background-color"] ??
      source.declarations["background"] ??
      "transparent",
    color: source.declarations["color"] ?? "inherit",
    borderColor: source.declarations["border-color"],
    borderRadius:
      source.declarations["border-radius"] ?? "inherit",
    paddingY: source.declarations["padding-top"] ?? source.declarations["padding"] ?? "—",
    paddingX:
      source.declarations["padding-left"] ?? source.declarations["padding"] ?? "—",
    fontWeight: parseInt(source.declarations["font-weight"] ?? "500", 10),
    fontSize: source.declarations["font-size"] ?? "—",
  };
}

function extractInput(parsed: ParsedCss) {
  const rule = parsed.rules.find((r) =>
    /(^|[\s,>+~])input(\b|\s|,|$)|\[type=text\]|\.input\b|\.form-input/.test(r.selector)
  );
  if (!rule) return undefined;
  return {
    background:
      rule.declarations["background-color"] ?? rule.declarations["background"] ?? "transparent",
    color: rule.declarations["color"] ?? "inherit",
    borderColor: rule.declarations["border-color"] ?? "currentColor",
    borderRadius: rule.declarations["border-radius"] ?? "—",
    paddingY: rule.declarations["padding-top"] ?? rule.declarations["padding"] ?? "—",
    paddingX: rule.declarations["padding-left"] ?? rule.declarations["padding"] ?? "—",
  };
}

function extractCard(parsed: ParsedCss) {
  const rule = parsed.rules.find((r) =>
    /\.card\b|\.panel\b|\[data-card\]/.test(r.selector)
  );
  if (!rule) return undefined;
  return {
    background:
      rule.declarations["background-color"] ?? rule.declarations["background"] ?? "transparent",
    borderColor: rule.declarations["border-color"] ?? "transparent",
    borderRadius: rule.declarations["border-radius"] ?? "—",
    padding: rule.declarations["padding"] ?? "—",
    shadow: rule.declarations["box-shadow"],
  };
}

function extractNavigation(parsed: ParsedCss) {
  const rule = parsed.rules.find((r) =>
    /(^|[\s,>+~])nav(\b|\s|,|$)|\.navbar\b|\.site-header\b|\.header\b/.test(r.selector)
  );
  if (!rule) return undefined;
  return {
    background:
      rule.declarations["background-color"] ?? rule.declarations["background"] ?? "transparent",
    color: rule.declarations["color"] ?? "inherit",
    height: rule.declarations["height"],
    isSticky:
      rule.declarations["position"]?.includes("sticky") ||
      rule.declarations["position"]?.includes("fixed") ||
      false,
  };
}
