export const metadata = {
  title: "What's new · design.md/extractor",
};

interface Entry {
  date: string;
  tag: "shipped" | "improvement" | "fix";
  title: string;
  body: React.ReactNode;
}

const ENTRIES: Entry[] = [
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "v0.4.0 — Vercel Analytics wired",
    body: (
      <>
        Adds <code>@vercel/analytics</code> so the Vercel dashboard surfaces
        traffic shape — pageviews, unique visitors, top referrers, countries,
        devices — without cookies or PII. Layered with the v0.3.0{" "}
        <code>/stats</code> KPI counters: <code>/stats</code> answers
        &quot;how is the product being used?&quot; (DESIGN.md generated,
        downloads, compares, discover visits), Vercel Analytics answers
        &quot;who showed up, and where from?&quot;. Both are zero-PII.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "v0.3.0 — public KPI counters and /stats",
    body: (
      <>
        Six public counters surfaced on a new <code>/stats</code> page: how
        many <code>DESIGN.md</code> files have been generated, how many{" "}
        <code>.md</code> downloads, how many compare runs, how many discover
        visits, top extracted hosts, top discovered brands, and top compare
        presets. Counters live in Upstash / Vercel KV in production and an
        in-memory store locally; no cookies, no IP logging, no PII — just the
        aggregates. The <code>/stats</code> page renders live with mono ASCII
        bar charts, on-brand for the deterministic-first stance.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "v0.2.0 — light/dark toggle, header & footer polish",
    body: (
      <>
        Pick your palette. A new toggle in the header flips the app between
        the dark IDE pane and a paper-thermal-printer light port; the choice
        persists in <code>localStorage</code> and is applied before React
        hydrates, so first paint always matches your preference. The header
        is trimmed to the four canonical actions, both wordmark and nav
        bumped to 15px for a more confident presence. Footer is now a single
        line: version on the left, &quot;built by @Bhikule19&quot; on the
        right. The optional BYOK AI prose layer is parked behind a 501 stub
        until the productionised flow is ready — extraction itself remains
        100% deterministic.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "v0.1.0 — IDE-native UI, cite provenance, compare mode",
    body: (
      <>
        Big release. The UI moves to a dark-canonical, mono-first IDE pane with
        an amber signal colour and JetBrains Mono + Inter Tight; the result
        page now streams a <code>[ HH:MM:SS ]</code> terminal log during
        extraction. Every colour swatch is clickable — opens a modal listing
        the actual CSS rules that declared it, with selector + property name.
        New <code>/compare</code> page diffs two URLs side by side: colours
        align by OKLCH ΔE, type roles by name, spacing/radius by ±1px. Token
        accuracy on Tailwind / Radix / WordPress sites is dramatically better
        thanks to a DOM class allowlist and theme-color / web-manifest
        signals.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "Compare mode (/compare)",
    body: (
      <>
        Paste two URLs. Three columns per category: <em>A only</em>,{" "}
        <em>shared</em>, <em>B only</em>. Brand audits, competitive intel,
        migration planning. Built on the same deterministic pipeline — no
        screenshots, no model.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "Cite-first transparency on every colour",
    body: (
      <>
        Click any swatch → modal shows the top CSS rules that declared this
        colour, with selector and property name. The Tokens JSON gains a{" "}
        <code>$provenance</code> field per token. The deterministic
        differentiator — vision-LLM extractors literally can&apos;t do this.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "Dark-canonical, mono-first redesign",
    body: (
      <>
        New token system, new fonts, prompt-style URL input with a{" "}
        <code>$</code> glyph and signal-coloured focus, streaming terminal
        log on extraction, <code>man</code>-page-style line-gutter Markdown
        viewer, syntax-highlighted JSON tab. Light mode is a faithful port.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "improvement",
    title: "DOM class allowlist + theme-color signals",
    body: (
      <>
        CSS rules whose selectors target a class actually present in the
        HTML get a 4× boost; rules targeting unused classes drop to 0.01×.
        <code>&lt;meta name=&quot;theme-color&quot;&gt;</code> and the web
        manifest <code>theme_color</code> feed brand-intent at high weight.
        Fixes the &quot;rule for unused class wins the brand vote&quot;
        failure on Tailwind sites.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "v0.0.1 — first public release",
    body: (
      <>
        Public beta. Deterministic extraction of colours, type, spacing, radius,
        shadow. Markdown + JSON output. <code>git clone</code> and self-host on
        Vercel free tier.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "improvement",
    title: "Brand intent + framework noise filter",
    body: (
      <>
        Resolves <code>var()</code> chains in custom properties. Down-weights{" "}
        <code>:root</code> palette tokens, <code>.wp-block-*</code>, Tailwind
        utility classes, and theme-builder selectors. Surfaces the actual brand
        on Tailwind / Radix / WordPress sites.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "improvement",
    title: "Colour clustering · perceptual ΔE",
    body: (
      <>
        Switched from naive RGB distance to <code>CIE ΔE2000</code> when
        collapsing near-duplicates. Stripe&apos;s <code>#635BFF</code> and{" "}
        <code>#6259FE</code> are now correctly merged into a single token.
      </>
    ),
  },
  // — BYOK AI prose changelog entry hidden until the feature returns —
  // {
  //   date: "2026-04-26",
  //   tag: "shipped",
  //   title: "BYOK AI prose, off by default",
  //   body: (
  //     <>
  //       Plug in an OpenRouter / Anthropic / Groq key to generate prose for
  //       Overview, Components, and Voice notes. AI sections are explicitly
  //       badged{" "}
  //       <span className="pill is-ai" style={{ verticalAlign: "middle" }}>
  //         AI-GENERATED
  //       </span>{" "}
  //       and underlined with a dotted line so readers can tell which words came
  //       from a model. The default extraction path remains 100% deterministic.
  //     </>
  //   ),
  // },
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "Discover gallery",
    body: (
      <>
        Eight curated extractions of well-known design systems, cached for 24h
        per slug. Each card shows the brand colour actually extracted from the
        source.
      </>
    ),
  },
  {
    date: "2026-04-26",
    tag: "fix",
    title: "Hydration warning from browser extensions",
    body: (
      <>
        Grammarly mutates <code>&lt;body&gt;</code> after SSR; we now suppress
        only the body-level hydration warning rather than the whole tree.
      </>
    ),
  },
];

export default function WhatsNewPage() {
  return (
    <div style={{ paddingTop: 56, paddingBottom: 40, maxWidth: 880 }}>
      <div style={{ display: "grid", gap: 12, marginBottom: 36 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="t-caption signal-text">// what&apos;s new</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">{ENTRIES.length} entries</span>
        </div>
        <h1 className="t-h1" style={{ margin: 0 }}>
          Changelog
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--mono)",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--fg-muted)",
          }}
        >
          Reverse chronological. Tagged{" "}
          <code style={{ color: "var(--signal)" }}>shipped</code> for new surface
          area, <code style={{ color: "var(--fg)" }}>improvement</code> for
          refinements, <code style={{ color: "var(--fg-muted)" }}>fix</code> for
          bugs.
        </p>
      </div>

      <div className="changelog">
        {ENTRIES.map((c, i) => (
          <div key={i} className="changelog-row">
            <span className="changelog-date">{c.date}</span>
            <span className={`changelog-tag t-${c.tag}`}>{c.tag}</span>
            <div>
              <div className="changelog-title">{c.title}</div>
              <div className="changelog-body">{c.body}</div>
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: 28,
          fontSize: 12,
          color: "var(--fg-subtle)",
          fontFamily: "var(--mono)",
        }}
      >
        // watch the repo on{" "}
        <a
          className="btn-link"
          href="https://github.com/Bhikule19/designmd-extractor"
          target="_blank"
          rel="noreferrer noopener"
        >
          github
        </a>
      </p>
    </div>
  );
}
