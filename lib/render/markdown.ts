import yaml from "js-yaml";
import type {
  ColorToken,
  ExtractedTokens,
  RadiusToken,
  ScaleToken,
  ShadowToken,
  TypographyRole,
} from "@/lib/types";

export function renderMarkdown(tokens: ExtractedTokens): string {
  const frontmatter = buildFrontmatter(tokens);
  const sections = [
    buildOverview(tokens),
    buildColorsSection(tokens),
    buildTypographySection(tokens),
    buildSpacingSection(tokens.spacing),
    buildRadiusSection(tokens.radius),
    buildShadowsSection(tokens.shadows),
    buildComponentsSection(tokens),
    buildDosAndDontsSection(tokens),
    buildAssetsSection(tokens),
  ].filter(Boolean);

  return `${frontmatter}\n\n${sections.join("\n\n")}\n`;
}

function buildFrontmatter(tokens: ExtractedTokens): string {
  const data = {
    name: tokens.meta.name,
    url: tokens.meta.url,
    extracted_at: tokens.meta.fetchedAt,
    colors: flattenColorsForYaml(tokens),
    typography: tokens.typography.roles.reduce<Record<string, unknown>>(
      (acc, role) => {
        acc[role.role] = {
          fontFamily: role.family,
          fontSize: `${role.size}px`,
          fontWeight: String(role.weight),
          lineHeight: String(role.lineHeight),
          ...(role.letterSpacing
            ? { letterSpacing: `${role.letterSpacing}px` }
            : {}),
        };
        return acc;
      },
      {}
    ),
    spacing: tokens.spacing.reduce<Record<string, string>>((acc, s) => {
      acc[s.name] = `${s.value}${s.unit}`;
      return acc;
    }, {}),
    radius: tokens.radius.reduce<Record<string, string>>((acc, r) => {
      acc[r.name] = r.value === 9999 ? "9999px" : `${r.value}${r.unit}`;
      return acc;
    }, {}),
  };

  const dump = yaml.dump(data, { lineWidth: 100, quotingType: "'", forceQuotes: false });
  return `---\n${dump}---`;
}

function flattenColorsForYaml(tokens: ExtractedTokens): Record<string, string> {
  const flat: Record<string, string> = {};
  const all = [
    ...tokens.colors.primary,
    ...tokens.colors.neutral,
    ...tokens.colors.semantic,
  ];
  for (const t of all) {
    flat[t.name] = t.hex;
  }
  return flat;
}

function buildOverview(tokens: ExtractedTokens): string {
  const { meta, colors, typography } = tokens;
  const colorCount =
    colors.primary.length + colors.neutral.length + colors.semantic.length;
  const fontFamilies = typography.fonts.map((f) => f.family).join(", ");

  return [
    `## Overview`,
    ``,
    meta.tagline
      ? `${meta.name} — ${meta.tagline}`
      : `Design system extracted from ${meta.hostname}.`,
    ``,
    `This document was generated **deterministically** from the site's static CSS — every token below is traceable to a real declaration. No language model was used to infer colours, typography, or spacing.`,
    ``,
    `**Snapshot:** ${colorCount} colour tokens · ${typography.roles.length} typography roles · ${tokens.spacing.length} spacing steps · ${tokens.radius.length} radii · ${tokens.shadows.length} shadow levels${fontFamilies ? ` · fonts: ${fontFamilies}` : ""}.`,
  ].join("\n");
}

function buildColorsSection(tokens: ExtractedTokens): string {
  const blocks: string[] = [`## Colours`, ``];

  if (tokens.colors.primary.length > 0) {
    blocks.push(`### Primary Palette`, ``, colorTable(tokens.colors.primary));
    blocks.push(``);
  }
  if (tokens.colors.neutral.length > 0) {
    blocks.push(`### Neutral Palette`, ``, colorTable(tokens.colors.neutral));
    blocks.push(``);
  }
  if (tokens.colors.semantic.length > 0) {
    blocks.push(`### Semantic Colours`, ``, colorTable(tokens.colors.semantic));
  }

  return blocks.join("\n").trimEnd();
}

function colorTable(tokens: ColorToken[]): string {
  const rows = tokens.map(
    (t) => `| \`${t.name}\` | \`${t.hex}\` | ${t.usage} |`
  );
  return [`| Token | Hex | Usage |`, `|---|---|---|`, ...rows].join("\n");
}

function buildTypographySection(tokens: ExtractedTokens): string {
  const { typography } = tokens;
  if (typography.roles.length === 0 && typography.fonts.length === 0) {
    return "";
  }

  const fontList = typography.fonts
    .map((f) => `- **${f.family}**${f.fallbacks.length ? ` — fallbacks: ${f.fallbacks.join(", ")}` : ""}`)
    .join("\n");

  const roleRows = typography.roles.map(
    (r) =>
      `| ${r.role} | ${r.family} | ${r.size}px | ${r.weight} | ${r.lineHeight} |`
  );

  return [
    `## Typography`,
    ``,
    fontList || "_No font stacks detected._",
    ``,
    `| Role | Family | Size | Weight | Line height |`,
    `|---|---|---|---|---|`,
    ...roleRows,
  ].join("\n");
}

function buildSpacingSection(spacing: ScaleToken[]): string {
  if (spacing.length === 0) return "";
  const rows = spacing.map(
    (s) => `| \`${s.name}\` | ${s.value}${s.unit} | ${s.usage} |`
  );
  return [
    `## Spacing`,
    ``,
    `| Token | Value | Usage |`,
    `|---|---|---|`,
    ...rows,
  ].join("\n");
}

function buildRadiusSection(radius: RadiusToken[]): string {
  if (radius.length === 0) return "";
  const rows = radius.map(
    (r) =>
      `| \`${r.name}\` | ${r.value === 9999 ? "9999px" : `${r.value}${r.unit}`} | ${r.usage} |`
  );
  return [
    `## Border Radius`,
    ``,
    `| Token | Value | Context |`,
    `|---|---|---|`,
    ...rows,
  ].join("\n");
}

function buildShadowsSection(shadows: ShadowToken[]): string {
  if (shadows.length === 0) return "";
  const rows = shadows.map(
    (s) => `| \`${s.name}\` | \`${s.value}\` | ${s.usage} |`
  );
  return [
    `## Elevation`,
    ``,
    `| Token | Value | Usage |`,
    `|---|---|---|`,
    ...rows,
  ].join("\n");
}

function buildComponentsSection(tokens: ExtractedTokens): string {
  const { components } = tokens;
  const blocks: string[] = [`## Components`, ``];

  if (components.buttons.length > 0) {
    blocks.push(`### Button`, ``);
    for (const b of components.buttons) {
      blocks.push(
        `**${capitalise(b.variant)}** — background \`${b.background}\`, text \`${b.color}\`${b.borderColor ? `, border \`${b.borderColor}\`` : ""}, radius \`${b.borderRadius}\`, padding \`${b.paddingY} ${b.paddingX}\`, weight ${b.fontWeight}, font-size \`${b.fontSize}\`.`
      );
      blocks.push(``);
    }
  }

  if (components.input) {
    const i = components.input;
    blocks.push(
      `### Input`,
      ``,
      `Background \`${i.background}\`, text \`${i.color}\`, border \`${i.borderColor}\`, radius \`${i.borderRadius}\`, padding \`${i.paddingY} ${i.paddingX}\`.`,
      ``
    );
  }

  if (components.card) {
    const c = components.card;
    blocks.push(
      `### Card`,
      ``,
      `Background \`${c.background}\`, border \`${c.borderColor}\`, radius \`${c.borderRadius}\`, padding \`${c.padding}\`${c.shadow ? `, shadow \`${c.shadow}\`` : ""}.`,
      ``
    );
  }

  if (components.navigation) {
    const n = components.navigation;
    blocks.push(
      `### Navigation`,
      ``,
      `Background \`${n.background}\`, text \`${n.color}\`${n.height ? `, height \`${n.height}\`` : ""}, ${n.isSticky ? "sticky/fixed positioning" : "static positioning"}.`,
      ``
    );
  }

  if (blocks.length <= 2) return "";
  return blocks.join("\n").trimEnd();
}

function buildDosAndDontsSection(tokens: ExtractedTokens): string {
  const dos: string[] = [];
  const donts: string[] = [];

  if (tokens.colors.primary[0]) {
    dos.push(
      `Use \`${tokens.colors.primary[0].name}\` (${tokens.colors.primary[0].hex}) as the dominant brand colour for primary actions.`
    );
    donts.push(
      `Don't pair \`${tokens.colors.primary[0].name}\` with another saturated brand colour at equal weight — pick one focal point per view.`
    );
  }

  const bodyRole = tokens.typography.roles.find((r) => r.role === "body");
  if (bodyRole) {
    dos.push(
      `Set body text in **${bodyRole.family}** at ${bodyRole.size}px / weight ${bodyRole.weight} for the highest legibility match to the source site.`
    );
    donts.push(
      `Don't drop body text below ${Math.max(bodyRole.size - 2, 12)}px — readability falls off quickly.`
    );
  }

  if (tokens.shadows.length > 0) {
    dos.push(
      `Apply \`${tokens.shadows[0].name}\` to cards at rest; reserve heavier shadows for floating layers.`
    );
    donts.push(
      `Don't stack shadows heavier than \`${tokens.shadows[tokens.shadows.length - 1].name}\` on stationary elements.`
    );
  }

  if (tokens.radius.length > 0) {
    dos.push(
      `Pick one corner-radius family (\`${tokens.radius[0].name}\` for inputs/buttons, larger for cards) and apply it consistently.`
    );
    donts.push(
      `Don't mix sharp (0px) and pill (9999px) radii on adjacent components — it reads as a glitch.`
    );
  }

  if (dos.length === 0) return "";

  return [
    `## Do's and Don'ts`,
    ``,
    `### Do`,
    ``,
    ...dos.map((d) => `- ${d}`),
    ``,
    `### Don't`,
    ``,
    ...donts.map((d) => `- ${d}`),
  ].join("\n");
}

function buildAssetsSection(tokens: ExtractedTokens): string {
  const { assets } = tokens;
  const lines: string[] = [`## Assets`, ``];

  if (assets.faviconUrl) lines.push(`- **Favicon:** ${assets.faviconUrl}`);
  if (assets.ogImageUrl) lines.push(`- **OG image:** ${assets.ogImageUrl}`);
  if (assets.fontHrefs.length > 0) {
    lines.push(`- **Font CDNs:**`);
    for (const href of assets.fontHrefs) lines.push(`  - ${href}`);
  }

  if (lines.length <= 2) return "";
  return lines.join("\n");
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
