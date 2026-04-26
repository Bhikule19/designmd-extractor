import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DISCOVER_ENTRIES } from "@/lib/discover";
import { TrackPageView } from "@/components/track-page-view";

export const metadata = {
  title: "Discover · design.md/extractor",
  description:
    "Real systems, taken apart. Curated extractions of well-known design systems.",
};

export default function DiscoverPage() {
  return (
    <div style={{ paddingTop: 56, paddingBottom: 40 }}>
      <TrackPageView event="discover" />
      <div style={{ display: "grid", gap: 12, marginBottom: 36, maxWidth: 720 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="t-caption signal-text">// discover</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">
            {DISCOVER_ENTRIES.length} curated extractions
          </span>
        </div>
        <h1 className="t-h1" style={{ margin: 0 }}>
          Real systems, taken apart.
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
          Each card opens a fresh deterministic extraction of the source — no
          guessing, no icon palette. Click to read the full DESIGN.md.
        </p>
      </div>

      <div
        className="row"
        style={{
          marginBottom: 0,
          gap: 0,
          padding: "12px 0",
          borderTop: "1px dashed var(--border)",
          borderBottom: "1px dashed var(--border)",
        }}
      >
        <span className="t-caption" style={{ flex: 1 }}>
          name
        </span>
        <span className="t-caption" style={{ width: 200 }}>
          accent · secondary
        </span>
        <span className="t-caption" style={{ width: 120, textAlign: "right" }}>
          host
        </span>
      </div>

      <div className="discover-grid" style={{ marginTop: -1 }}>
        {DISCOVER_ENTRIES.map((s) => (
          <Link key={s.slug} href={`/discover/${s.slug}`} className="dcard">
            <div className="dcard-head">
              <div>
                <div className="dcard-name">{s.name}</div>
                <div className="dcard-host">{s.hostname}</div>
              </div>
              <ArrowRight size={14} strokeWidth={1.5} />
            </div>
            <div
              className="dcard-swatch"
              style={{
                background: `linear-gradient(90deg, ${s.hintAccent} 0%, ${s.hintAccent} 70%, ${s.hintSecondary} 70%, ${s.hintSecondary} 100%)`,
              }}
            />
            <div className="dcard-tag">{s.tagline}</div>
            <div className="dcard-meta">
              <span className="row" style={{ gap: 6 }}>
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    background: s.hintAccent,
                  }}
                />
                <span>{s.hintAccent.toUpperCase()}</span>
              </span>
              <span>extract →</span>
            </div>
          </Link>
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
        // colours sampled from real CSS · cached for 24h per slug
      </p>
    </div>
  );
}
