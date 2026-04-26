import type { ExtractedTokens } from "@/lib/types";

export type ProseSection = "overview" | "components" | "guidelines";

export function buildSystemPrompt(): string {
  return [
    "You are a senior design-systems writer.",
    "You write tight, precise prose for DESIGN.md files.",
    "Stick to British English spelling.",
    "Never invent tokens, hex codes, or font names — only describe what is in the supplied JSON.",
    "Avoid marketing language. Avoid emoji. Avoid fluffy adjectives like 'effortless', 'beautiful', 'stunning'.",
  ].join(" ");
}

export function buildSectionPrompt(
  section: ProseSection,
  tokens: ExtractedTokens
): string {
  const summary = summariseTokens(tokens);
  const instruction = sectionInstruction(section);
  return [
    `Tokens (JSON, authoritative — do not contradict):`,
    "```json",
    summary,
    "```",
    "",
    instruction,
  ].join("\n");
}

function sectionInstruction(section: ProseSection): string {
  switch (section) {
    case "overview":
      return [
        "Write a 90–130 word **Overview** describing the design system's character.",
        "Mention the dominant brand colour (by hex), the primary font family, and the radius / spacing rhythm.",
        "Tell the reader what the system is good for.",
        "Plain Markdown — no headings, no bullet lists.",
      ].join(" ");
    case "components":
      return [
        "Write three short paragraphs — one for **Buttons**, one for **Inputs**, one for **Cards** — describing how each should look and behave, grounded in the supplied component specs.",
        "Each paragraph: 40–60 words. Use Markdown bold for the component name at the start of each paragraph.",
      ].join(" ");
    case "guidelines":
      return [
        "Write a 'Voice & Application Notes' section: 80–120 words explaining when to deviate from the tokens (e.g. accessibility, dark mode), and the one rule a designer most often violates with this system.",
        "Plain Markdown.",
      ].join(" ");
  }
}

function summariseTokens(tokens: ExtractedTokens): string {
  return JSON.stringify(
    {
      site: { name: tokens.meta.name, hostname: tokens.meta.hostname },
      colors: {
        primary: tokens.colors.primary.map((c) => ({
          name: c.name,
          hex: c.hex,
          usage: c.usage,
        })),
        neutral: tokens.colors.neutral.map((c) => ({
          name: c.name,
          hex: c.hex,
        })),
        semantic: tokens.colors.semantic.map((c) => ({
          name: c.name,
          hex: c.hex,
          kind: c.semanticKind,
        })),
      },
      fonts: tokens.typography.fonts.map((f) => f.family),
      bodyFontSize: tokens.typography.roles.find((r) => r.role === "body")?.size,
      radii: tokens.radius.map((r) => ({ name: r.name, value: r.value })),
      spacing: tokens.spacing.map((s) => ({ name: s.name, value: s.value })),
      hasShadows: tokens.shadows.length > 0,
      buttons: tokens.components.buttons.map((b) => b.variant),
    },
    null,
    2
  );
}
