import { readStats } from "@/lib/track";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Stats · design.md/extractor",
  description:
    "Live counters from the deterministic extractor. No cookies, no tracking, no PII.",
};

const BAR_WIDTH = 22;

export default async function StatsPage() {
  const stats = await readStats();

  const totals = [
    {
      label: "DESIGN.md generated",
      value: stats.extract.total,
    },
    {
      label: "downloads (.md)",
      value: stats.download.total,
    },
    {
      label: "compare runs",
      value: stats.compare.total,
    },
    {
      label: "discover visits",
      value: stats.discover.total,
    },
  ];
  const totalsMax = Math.max(...totals.map((t) => t.value), 1);

  return (
    <div style={{ paddingTop: 56, paddingBottom: 80 }}>
      <header style={{ display: "grid", gap: 12, marginBottom: 36, maxWidth: 760 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="t-caption signal-text">// stats</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">live counters</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">public</span>
        </div>
        <h1 className="t-h1" style={{ margin: 0 }}>
          What people are running.
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
          Six counters, incremented on the relevant action, persisted in a
          shared key-value store. No cookies, no IP logging, no PII — only the
          numbers below.
        </p>
      </header>

      <Section title="// totals" meta={`refreshed ${formatTs(stats.generatedAt)}`}>
        <ul className="diff-list" style={{ background: "var(--surface)" }}>
          {totals.map((t) => (
            <BarRow key={t.label} label={t.label} value={t.value} max={totalsMax} />
          ))}
        </ul>
      </Section>

      <Section
        title="// top extracted hosts"
        meta={`${stats.extract.topHosts.length} of ${stats.extract.total.toLocaleString()}`}
      >
        <ZsetTable
          rows={stats.extract.topHosts}
          empty="No extractions yet — be the first to paste a URL on the home page."
        />
      </Section>

      <Section
        title="// top discover brands"
        meta={`${stats.discover.topSlugs.length} of ${stats.discover.total.toLocaleString()}`}
      >
        <ZsetTable
          rows={stats.discover.topSlugs}
          empty="No discover visits yet."
        />
      </Section>

      <Section
        title="// top compare presets"
        meta={`${stats.compare.topPresets.length} of ${stats.compare.total.toLocaleString()}`}
      >
        <ZsetTable
          rows={stats.compare.topPresets}
          empty="No preset compares yet."
        />
      </Section>

      <p
        style={{
          marginTop: 28,
          fontSize: 12,
          color: "var(--fg-subtle)",
          fontFamily: "var(--mono)",
        }}
      >
        // counters refresh on every page load · in-memory locally · Vercel KV in production
      </p>
    </div>
  );
}

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 32, display: "grid", gap: 14 }}>
      <div
        className="row"
        style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
      >
        <span className="t-caption signal-text">{title}</span>
        {meta && <span className="t-caption">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function BarRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const filled = Math.max(1, Math.round((value / max) * BAR_WIDTH));
  return (
    <li
      className="diff-row"
      style={{
        gridTemplateColumns: "180px 1fr 100px",
        gap: 16,
      }}
    >
      <span style={{ color: "var(--fg)", fontSize: 13 }}>{label}</span>
      <span
        aria-hidden
        style={{
          fontFamily: "var(--mono)",
          color: "var(--signal)",
          fontSize: 12,
          letterSpacing: "0.04em",
          whiteSpace: "pre",
        }}
      >
        {"█".repeat(filled)}
        <span style={{ color: "var(--border)" }}>
          {"░".repeat(Math.max(0, BAR_WIDTH - filled))}
        </span>
      </span>
      <span
        className="tnum"
        style={{
          fontSize: 13,
          color: "var(--fg)",
          fontFamily: "var(--mono)",
          textAlign: "right",
          fontFeatureSettings: "'tnum' on",
        }}
      >
        {value.toLocaleString()}
      </span>
    </li>
  );
}

function ZsetTable({
  rows,
  empty,
}: {
  rows: Array<{ member: string; score: number }>;
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p
        className="t-caption"
        style={{ color: "var(--fg-subtle)", margin: 0, padding: "12px 0" }}
      >
        {empty}
      </p>
    );
  }
  const max = Math.max(...rows.map((r) => r.score), 1);
  return (
    <ul className="diff-list" style={{ background: "var(--surface)" }}>
      {rows.map((r) => (
        <BarRow key={r.member} label={r.member} value={r.score} max={max} />
      ))}
    </ul>
  );
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} utc`;
  } catch {
    return "—";
  }
}
