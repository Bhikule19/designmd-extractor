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
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "BYOK AI prose, off by default",
    body: (
      <>
        Plug in an OpenRouter / Anthropic / Groq key to generate prose for
        Overview, Components, and Voice notes. AI sections are explicitly
        badged{" "}
        <span className="pill is-ai" style={{ verticalAlign: "middle" }}>
          AI-GENERATED
        </span>{" "}
        and underlined with a dotted line so readers can tell which words came
        from a model. The default extraction path remains 100% deterministic.
      </>
    ),
  },
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
