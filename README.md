# DESIGN.md Extractor

Paste any URL. Get back a deterministic `DESIGN.md` — colour tokens, typography
roles, spacing scale, radii, elevations, components — extracted from the site's
real CSS.

[**Live demo →**](http://localhost:3000) · MIT · `v0.1.0`

## What makes this different

Most "design system from a URL" tools today are **AI-first**: they screenshot
the page, feed it to a vision LLM, and let the model invent token names and
hex codes. That looks impressive but it hallucinates — you can't trust what
comes out without checking the original site by hand.

This project is **deterministic-first**:

| Section in `DESIGN.md`                         | How it's produced |
| ---                                            | --- |
| YAML frontmatter                               | Extracted from CSS rules and `--custom` properties |
| Colour palette (Primary / Neutral / Semantic) | OKLCH clustering with ΔE2000 + selector-context classification |
| Typography roles                               | Computed from real `font-family`, `font-size`, `font-weight`, `line-height` rules |
| Spacing, radius, shadow scales                 | Aggregated and snapped from `padding`, `margin`, `gap`, `border-radius`, `box-shadow` |
| Component specs (Button, Input, Card, Nav)     | Read directly from matching CSS rules |
| Do's & Don'ts                                  | Templated from the extracted tokens |
| Assets (favicon, OG image, font CDNs)          | Parsed from `<head>` |
| **Provenance**                                 | Every colour token cites the actual CSS rules that declared it |
| **Optional prose** (Overview, Voice notes)     | **You** bring the API key — generates with your own OpenRouter / Anthropic / Groq account |

If the live site changes, re-running the extractor produces the same output.
There is no model in the default path.

## What's new in 0.1.0

- **Cite-first transparency.** Click any colour swatch on the result page →
  modal shows the exact CSS rules and properties that declared it. Same data
  available as `$provenance` in the Tokens JSON output.
- **Compare mode (`/compare`).** Paste two URLs, get a side-by-side diff.
  Colours align by perceptual distance (OKLCH ΔE2000), typography by role
  name, spacing/radius by ±1px tolerance.
- **DOM class allowlist.** CSS rules whose selectors target a class actually
  present in the served HTML get a 4× boost; rules targeting unused classes
  drop to 0.01×. Fixes the "rule for unused class wins the brand vote" failure
  mode on Tailwind / Radix / WordPress sites.
- **Header-level brand signals.** `<meta name="theme-color">` and the web
  manifest `theme_color` feed brand-intent at high weight.
- **IDE-native UI.** Dark canonical, mono-first (JetBrains Mono + Inter Tight),
  amber signal colour, prompt-style URL input, streaming `[ HH:MM:SS ]`
  terminal log during extraction. Light mode is a faithful port.

See [/whats-new](app/whats-new/page.tsx) for the full changelog.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`, paste a URL, click **Run**.

### Other scripts

```bash
pnpm test          # Vitest unit tests (48 currently)
pnpm typecheck     # tsc --noEmit
pnpm build         # Production build
```

## Optional AI prose

Click **AI prose: off** on any result page. Pick a provider, paste an API key,
hit **Enable**. The key is stored in your browser's `localStorage` and sent
through `/api/prose` directly to the upstream provider — never logged or
persisted server-side. Each AI-generated paragraph is rendered with a
`(AI-generated)` label and a dotted underline so a reader can tell which words
came from a model.

## How extraction works

```
fetch HTML  ───►  parse linked stylesheets  ───►  walk CSS AST
                                                       │
                       ┌───────────────────────────────┼───────────────┐
                       ▼              ▼                ▼               ▼
                    colours        typography        spacing       components
                       │              │                │               │
                       └──── render Markdown / JSON / Preview ─────────┘
```

Each token also carries the top-N CSS rules that declared it, so every value
in the output can be traced back to its source rule.

Everything lives in `lib/extract/` (one file per concern), `lib/compare.ts`
(pure diff library), and `lib/render/` (Markdown, JSON, and the visual
preview component).

## Limitations

- **No headless browser.** Sites that ship empty HTML and inject everything
  via JavaScript (pure SPAs) won't expose any CSS to extract from. The
  extractor returns a clear `NO_CSS_FOUND` error in that case.
- **Utility-class sites** (Tailwind, etc.) report fewer typography roles
  because there are no `h1 {}` rules to read from — the styles live inside
  `class="text-xl font-bold"` annotations on JSX. A future Playwright fallback
  will run `getComputedStyle()` on rendered elements to recover this.
- **`@import` chains** are not followed past the first level.

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Radix · Zustand ·
React Hook Form + Zod · `cheerio` · `css-tree` · `culori` · `js-yaml` ·
Vitest · happy-dom.

## Project layout

```
app/                  Next.js routes (home, /compare, /discover, /whats-new, /api/*)
components/           UI components (URL form, result tabs, compare flow, AI dialog)
components/ui/        Radix-based primitives
lib/extract/          Deterministic extractors (one file per concern)
lib/render/           Markdown / JSON / Preview renderers
lib/compare.ts        Pure diff library for two ExtractedTokens objects
lib/ai/               BYOK prose: providers + prompts
lib/store.ts          Zustand stores for extract / compare / AI settings
tests/                Vitest unit tests + CSS fixtures
```

## Roadmap

- [ ] Public, stable, free-tier API with API keys
- [ ] CLI: `npx design-extract <url>` with Tailwind-config / Style Dictionary adapters
- [ ] MCP server so agents can call extraction natively
- [ ] Verify mode: diff a URL against an existing `DESIGN.md`
- [ ] Watch mode: nightly diff, emails / RSS on change
- [ ] Playwright fallback worker for JS-rendered SPAs

## Licence

MIT.
