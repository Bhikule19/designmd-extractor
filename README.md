# DESIGN.md Extractor

Paste any URL. Get back a deterministic `DESIGN.md` — colour tokens, typography
roles, spacing scale, radii, elevations, components — extracted from the site's
real CSS.

## What makes this different

Most "design system from a URL" tools today are **AI-first**: they screenshot the
page, feed it to a vision LLM, and let the model invent token names and hex
codes. That looks impressive but it hallucinates — you can't trust what comes
out without checking the original site by hand.

This project is **deterministic-first**:

| Section in `DESIGN.md` | How it's produced |
| --- | --- |
| YAML frontmatter | Extracted from CSS rules and `--custom` properties |
| Colour palette (Primary / Neutral / Semantic) | OKLCH clustering with ΔE2000 + selector-context classification |
| Typography roles | Computed from real `font-family`, `font-size`, `font-weight`, `line-height` rules |
| Spacing, radius, shadow scales | Aggregated and snapped from `padding`, `margin`, `gap`, `border-radius`, `box-shadow` |
| Component specs (Button, Input, Card, Nav) | Read directly from matching CSS rules |
| Do's & Don'ts | Templated from the extracted tokens |
| Assets (favicon, OG image, font CDNs) | Parsed from `<head>` |
| **Optional prose** (Overview, Voice notes) | **You** bring the API key — generates with your own OpenRouter / Anthropic / Groq account |

If the live site changes, re-running the extractor produces the same output.
There is no model in the default path.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`, paste a URL, click **Extract**.

### Other scripts

```bash
pnpm test          # Vitest unit tests
pnpm typecheck     # tsc --noEmit
pnpm build         # Production build
```

## Optional AI prose

Click **AI prose: off** on any result page. Pick a provider, paste an API key,
hit **Enable**. The key is stored in your browser's `localStorage` and sent
through `/api/prose` directly to the upstream provider — never logged or
persisted server-side. Each AI-generated paragraph is rendered with a
`(AI-generated)` label so a reader can tell which words came from a model.

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

Everything lives in `lib/extract/` (one file per concern) and `lib/render/`
(Markdown, JSON, and the visual preview component).

## Limitations (V1)

- **No headless browser.** Sites that ship empty HTML and inject everything via
  JavaScript (some SPAs) won't expose any CSS to extract from. The extractor
  returns a clear `NO_CSS_FOUND` error in that case.
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
app/                  Next.js routes (home, /discover, /whats-new, /api/*)
components/           UI components (URL form, result tabs, AI dialog)
components/ui/        Radix-based primitives
lib/extract/          Deterministic extractors (one file per concern)
lib/render/           Markdown / JSON / Preview renderers
lib/ai/               BYOK prose: providers + prompts
lib/store.ts          Zustand stores for extract state and AI settings
tests/                Vitest unit tests + CSS fixtures
```

## Roadmap

- [ ] Playwright fallback worker for JS-rendered sites
- [ ] "Describe project" mode (generate a system from a text prompt)
- [ ] Token coverage diff against an existing `DESIGN.md`
- [ ] CLI: `npx design-extract <url>`
- [ ] Figma-tokens / Style Dictionary export

## Licence

MIT.
