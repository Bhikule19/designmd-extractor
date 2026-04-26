"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Copy,
  Download,
  RotateCcw,
} from "lucide-react";
import { renderMarkdown } from "@/lib/render/markdown";
import { renderTokensJsonString } from "@/lib/render/tokens-json";
import { useExtractStore, useAiSettings } from "@/lib/store";
import type { ColorToken, ExtractedTokens, TypographyRole } from "@/lib/types";
import { AiProseDialog } from "@/components/ai-prose-dialog";
import { AiProseSection } from "@/components/ai-prose-section";

type Tab = "preview" | "markdown" | "tokens";

export function ResultView({ tokens }: { tokens: ExtractedTokens }) {
  const router = useRouter();
  const reset = useExtractStore((s) => s.reset);
  const aiEnabled = useAiSettings((s) => s.enabled);

  const [tab, setTab] = React.useState<Tab>("preview");
  const markdown = React.useMemo(() => renderMarkdown(tokens), [tokens]);
  const json = React.useMemo(
    () => renderTokensJsonString(tokens),
    [tokens]
  );
  const filenameBase = tokens.meta.hostname.replace(/\./g, "-");

  function startOver() {
    reset();
    router.push("/");
  }

  const stats = {
    colors:
      tokens.colors.primary.length +
      tokens.colors.neutral.length +
      tokens.colors.semantic.length,
    type: tokens.typography.roles.length,
    spacing: tokens.spacing.length,
    radius: tokens.radius.length,
    shadows: tokens.shadows.length,
  };

  const fetchedAtFormatted = (() => {
    try {
      const d = new Date(tokens.meta.fetchedAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
        d.getUTCDate()
      )} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
        d.getUTCSeconds()
      )} utc`;
    } catch {
      return tokens.meta.fetchedAt;
    }
  })();

  return (
    <div>
      <div className="result-head">
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <span className="t-caption signal-text">// extracted</span>
          <span className="t-caption">{fetchedAtFormatted}</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">deterministic</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">
            {tokens.diagnostics.cssBytes.toLocaleString()} bytes css ·{" "}
            {tokens.diagnostics.stylesheetCount} sheets
          </span>
        </div>
        <div
          className="row"
          style={{ gap: 16, flexWrap: "wrap", alignItems: "baseline" }}
        >
          <h1 className="t-h1" style={{ margin: 0 }}>
            {tokens.meta.name}
          </h1>
          <a
            className="btn-link"
            href={tokens.meta.url}
            target="_blank"
            rel="noreferrer noopener"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {tokens.meta.hostname}
            <ArrowUpRight size={11} strokeWidth={1.5} />
          </a>
        </div>
        {tokens.meta.tagline && (
          <p
            className="t-body-sm"
            style={{ color: "var(--fg-muted)", margin: 0, maxWidth: 760 }}
          >
            {tokens.meta.tagline}
          </p>
        )}
        <div className="result-meta">
          <span className="stat">
            <span className="num tnum">{stats.colors}</span> colours
          </span>
          <span className="faint">·</span>
          <span className="stat">
            <span className="num tnum">{stats.type}</span> type roles
          </span>
          <span className="faint">·</span>
          <span className="stat">
            <span className="num tnum">{stats.spacing}</span> spacing steps
          </span>
          <span className="faint">·</span>
          <span className="stat">
            <span className="num tnum">{stats.radius}</span> radii
          </span>
          <span className="faint">·</span>
          <span className="stat">
            <span className="num tnum">{stats.shadows}</span> shadows
          </span>
        </div>
      </div>

      <div className="result-toolbar">
        <div className="tabs" style={{ flex: 1, border: 0 }}>
          <button
            type="button"
            className={`tab ${tab === "preview" ? "is-active" : ""}`}
            onClick={() => setTab("preview")}
          >
            preview <span className="count">/ visual</span>
          </button>
          <button
            type="button"
            className={`tab ${tab === "markdown" ? "is-active" : ""}`}
            onClick={() => setTab("markdown")}
          >
            markdown <span className="count">/ DESIGN.md</span>
          </button>
          <button
            type="button"
            className={`tab ${tab === "tokens" ? "is-active" : ""}`}
            onClick={() => setTab("tokens")}
          >
            tokens <span className="count">/ json</span>
          </button>
        </div>
        <button className="btn btn-ghost" onClick={startOver}>
          <RotateCcw size={12} strokeWidth={1.5} />
          new url
        </button>
        <AiProseDialog />
        <CopyBtn value={markdown} label="copy md" />
        <DownloadBtn
          filename={`${filenameBase}.DESIGN.md`}
          content={markdown}
          label="download .md"
          variant="signal"
        />
      </div>

      {tab === "preview" && <PreviewTab tokens={tokens} aiEnabled={aiEnabled} />}
      {tab === "markdown" && (
        <MarkdownViewer markdown={markdown} filenameBase={filenameBase} />
      )}
      {tab === "tokens" && <TokensViewer json={json} filenameBase={filenameBase} />}

      {tokens.diagnostics.warnings.length > 0 && (
        <aside
          style={{
            marginTop: 32,
            padding: 14,
            border: "1px solid rgba(212, 161, 74, 0.35)",
            borderRadius: "var(--r-md)",
            background: "rgba(212, 161, 74, 0.06)",
          }}
        >
          <div className="row" style={{ marginBottom: 6 }}>
            <span className="pill" style={{ color: "var(--warn)" }}>
              warnings
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 18px",
              listStyle: "disc",
              fontSize: 12,
              color: "var(--fg-muted)",
            }}
          >
            {tokens.diagnostics.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

/* ──────────────── Preview tab ──────────────── */

function PreviewTab({
  tokens,
  aiEnabled,
}: {
  tokens: ExtractedTokens;
  aiEnabled: boolean;
}) {
  const allColors = [
    ...tokens.colors.primary,
    ...tokens.colors.neutral,
    ...tokens.colors.semantic,
  ];

  return (
    <div style={{ display: "grid", gap: 48, padding: "32px 0" }}>
      <section>
        <div
          className="row"
          style={{ justifyContent: "space-between", marginBottom: 18 }}
        >
          <h3 className="t-h3">
            Colours <span className="faint">/ {allColors.length}</span>
          </h3>
          <span className="t-caption">
            from {tokens.diagnostics.cssBytes.toLocaleString()} bytes
          </span>
        </div>
        {tokens.colors.primary.length > 0 && (
          <SwatchGrid title="Primary" colors={tokens.colors.primary} />
        )}
        {tokens.colors.neutral.length > 0 && (
          <SwatchGrid title="Neutral" colors={tokens.colors.neutral} />
        )}
        {tokens.colors.semantic.length > 0 && (
          <SwatchGrid title="Semantic" colors={tokens.colors.semantic} />
        )}
      </section>

      {aiEnabled && (
        <section>
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 12 }}
          >
            <h3 className="t-h3">AI prose</h3>
            <span className="t-caption" style={{ color: "var(--ai)" }}>
              your key · streamed
            </span>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <AiProseSection section="overview" tokens={tokens} />
            <AiProseSection section="components" tokens={tokens} />
            <AiProseSection section="guidelines" tokens={tokens} />
          </div>
        </section>
      )}

      {tokens.typography.roles.length > 0 && (
        <section>
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 8 }}
          >
            <h3 className="t-h3">
              Type ramp{" "}
              <span className="faint">
                / {tokens.typography.roles.length} roles
              </span>
            </h3>
            <span className="t-caption">
              {tokens.typography.fonts.map((f) => f.family).join(" · ") ||
                "no fonts detected"}
            </span>
          </div>
          <div className="card">
            <div style={{ padding: "0 20px" }}>
              {tokens.typography.roles.map((r) => (
                <TypeRow key={r.role} role={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {tokens.spacing.length > 0 && (
        <section>
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 18 }}
          >
            <h3 className="t-h3">
              Spacing{" "}
              <span className="faint">/ {tokens.spacing.length} steps</span>
            </h3>
            <span className="t-caption">
              extracted from padding · margin · gap
            </span>
          </div>
          <div className="card">
            <div style={{ padding: "12px 20px" }}>
              {tokens.spacing.map((s) => (
                <div key={s.name} className="spacing-row">
                  <span className="spacing-name">{s.name}</span>
                  <span className="spacing-px">
                    {s.value}
                    {s.unit}
                  </span>
                  <div
                    className="spacing-bar"
                    style={{ width: Math.min(s.value * 4, 600) }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tokens.radius.length > 0 && (
        <section>
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 18 }}
          >
            <h3 className="t-h3">
              Radius{" "}
              <span className="faint">/ {tokens.radius.length} values</span>
            </h3>
            <span className="t-caption">extracted from border-radius</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(
                tokens.radius.length,
                5
              )}, 1fr)`,
              gap: 12,
            }}
          >
            {tokens.radius.map((r) => (
              <div
                key={r.name}
                className="card"
                style={{
                  padding: 20,
                  display: "grid",
                  gap: 14,
                  justifyItems: "center",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: r.value === 9999 ? 9999 : r.value,
                  }}
                />
                <div className="col" style={{ alignItems: "center", gap: 2 }}>
                  <span className="t-body-sm">{r.name}</span>
                  <span className="t-label">
                    {r.value === 9999 ? "full" : `${r.value}px`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tokens.shadows.length > 0 && (
        <section>
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 18 }}
          >
            <h3 className="t-h3">
              Elevation{" "}
              <span className="faint">/ {tokens.shadows.length} levels</span>
            </h3>
            <span className="t-caption">box-shadow · grouped by blur</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${tokens.shadows.length}, 1fr)`,
              gap: 12,
            }}
          >
            {tokens.shadows.map((s) => (
              <div
                key={s.name}
                className="card"
                style={{ padding: 18, background: "var(--surface-2)" }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    marginBottom: 10,
                    boxShadow: s.value,
                  }}
                />
                <div className="col" style={{ alignItems: "center", gap: 2 }}>
                  <span className="t-body-sm">{s.name}</span>
                  <span className="t-caption">{s.usage}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SwatchGrid({
  title,
  colors,
}: {
  title: string;
  colors: ColorToken[];
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4
        className="t-caption"
        style={{ marginBottom: 12, color: "var(--fg-muted)" }}
      >
        {title}
      </h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {colors.map((c) => (
          <Swatch key={c.name} token={c} />
        ))}
      </div>
    </div>
  );
}

function Swatch({ token }: { token: ColorToken }) {
  const [copied, setCopied] = React.useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard?.writeText(token.hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  }
  return (
    <div
      className="swatch"
      onClick={copy}
      title="click to copy hex"
      role="button"
      tabIndex={0}
    >
      <div className="swatch-fill" style={{ background: token.hex }} />
      <div className="swatch-meta">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="swatch-name">{token.name}</span>
          <span
            style={{
              fontSize: 10,
              color: copied ? "var(--signal)" : "var(--fg-faint)",
              letterSpacing: "0.04em",
            }}
          >
            {copied ? "COPIED" : "⌘C"}
          </span>
        </div>
        <span className="swatch-hex">{token.hex.toUpperCase()}</span>
        <span className="swatch-use">{token.usage}</span>
      </div>
    </div>
  );
}

function TypeRow({ role }: { role: TypographyRole }) {
  return (
    <div className="ramp-row">
      <span className="ramp-role">{role.role}</span>
      <span
        style={{
          fontFamily: `${role.family}, var(--sans)`,
          fontSize: Math.min(role.size, 44),
          fontWeight: role.weight,
          lineHeight: 1,
          letterSpacing: role.letterSpacing
            ? `${role.letterSpacing}px`
            : undefined,
          color: "var(--fg)",
        }}
      >
        The forensic notebook
      </span>
      <span className="ramp-meta">
        {role.size}px / {role.lineHeight} · {role.weight} · {role.family}
      </span>
    </div>
  );
}

/* ──────────────── Markdown tab ──────────────── */

function MarkdownViewer({
  markdown,
  filenameBase,
}: {
  markdown: string;
  filenameBase: string;
}) {
  const lines = markdown.split("\n");
  return (
    <div style={{ padding: "24px 0" }}>
      <div className="card">
        <div className="card-head">
          <div className="row" style={{ gap: 10 }}>
            <span className="t-caption">DESIGN.md</span>
            <span className="t-caption faint">·</span>
            <span className="t-caption">
              {(markdown.length / 1024).toFixed(1)} KB
            </span>
            <span className="t-caption faint">·</span>
            <span className="t-caption">{lines.length} lines</span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <CopyBtn value={markdown} label="copy" />
            <DownloadBtn
              filename={`${filenameBase}.DESIGN.md`}
              content={markdown}
              label=".md"
            />
          </div>
        </div>
        <div className="card-body" style={{ padding: "20px 0" }}>
          <pre className="md">{lines.map((l, i) => renderMdLine(l, i))}</pre>
        </div>
      </div>
    </div>
  );
}

function renderMdLine(line: string, i: number): React.ReactNode {
  const num = String(i + 1).padStart(2, " ");
  const gutter = (
    <span className="gutter">{num}</span>
  );

  if (line === "---") {
    return (
      <div key={i}>
        {gutter}
        <span className="hr">{line}</span>
      </div>
    );
  }
  if (line === "") {
    return <div key={i}>{gutter}</div>;
  }
  if (line.startsWith("### ")) {
    return (
      <div key={i}>
        {gutter}
        <span className="heading heading-3">{line}</span>
      </div>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <div key={i}>
        {gutter}
        <span className="heading heading-2">{line}</span>
      </div>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <div key={i}>
        {gutter}
        <span className="heading heading-1">{line}</span>
      </div>
    );
  }
  if (line.startsWith("|")) {
    return (
      <div key={i}>
        {gutter}
        <span className="table-line">{line}</span>
      </div>
    );
  }
  // YAML frontmatter detection: a "key: value" line in the leading frontmatter block
  const fm = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
  if (fm) {
    return (
      <div key={i} className="frontmatter">
        {gutter}
        <span className="key">{fm[1]}:</span>{" "}
        <span className="val">{fm[2]}</span>
      </div>
    );
  }
  if (line.startsWith("<!--")) {
    return (
      <div key={i}>
        {gutter}
        <span className="comment">{line}</span>
      </div>
    );
  }
  return (
    <div key={i}>
      {gutter}
      <span>{line}</span>
    </div>
  );
}

/* ──────────────── Tokens JSON tab ──────────────── */

function TokensViewer({
  json,
  filenameBase,
}: {
  json: string;
  filenameBase: string;
}) {
  const lines = json.split("\n");
  return (
    <div style={{ padding: "24px 0" }}>
      <div className="card">
        <div className="card-head">
          <div className="row" style={{ gap: 10 }}>
            <span className="t-caption">tokens.json</span>
            <span className="t-caption faint">·</span>
            <span className="t-caption">W3C design tokens format</span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <CopyBtn value={json} label="copy" />
            <DownloadBtn
              filename={`${filenameBase}.tokens.json`}
              content={json}
              label=".json"
              mimeType="application/json"
            />
          </div>
        </div>
        <div className="card-body" style={{ padding: "20px 0" }}>
          <pre className="md">
            {lines.map((line, i) => renderJsonLine(line, i))}
          </pre>
        </div>
      </div>
    </div>
  );
}

function renderJsonLine(line: string, i: number): React.ReactNode {
  const num = String(i + 1).padStart(3, " ");
  const gutter = <span className="gutter">{num}</span>;

  // Tokenise: "$key" / "key": / "string" / number / punctuation
  const parts: React.ReactNode[] = [];
  const re =
    /(\$[a-zA-Z]+)|("[\w$-]+"\s*:)|("[^"\\]*(?:\\.[^"\\]*)*")|(-?\b\d+(?:\.\d+)?\b)|([{}\[\],:])|(\s+)|([^\s{}\[\],:"]+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(line)) !== null) {
    const [token, dollar, propKey, str, num, punct, ws, other] = m;
    if (dollar) {
      parts.push(
        <span key={key++} style={{ color: "var(--signal)" }}>
          {token}
        </span>
      );
    } else if (propKey) {
      parts.push(
        <span key={key++} style={{ color: "var(--fg)" }}>
          {token}
        </span>
      );
    } else if (str) {
      parts.push(
        <span key={key++} style={{ color: "var(--ai)" }}>
          {token}
        </span>
      );
    } else if (num) {
      parts.push(
        <span key={key++} style={{ color: "var(--ok)" }}>
          {token}
        </span>
      );
    } else if (punct) {
      parts.push(
        <span key={key++} style={{ color: "var(--fg-muted)" }}>
          {token}
        </span>
      );
    } else if (ws) {
      parts.push(<span key={key++}>{token}</span>);
    } else {
      parts.push(<span key={key++}>{token}</span>);
    }
  }

  return (
    <div key={i}>
      {gutter}
      {parts}
    </div>
  );
}

/* ──────────────── Inline buttons ──────────────── */

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      <Copy size={12} strokeWidth={1.5} />
      {copied ? "copied" : label}
    </button>
  );
}

function DownloadBtn({
  filename,
  content,
  label,
  mimeType = "text/markdown",
  variant,
}: {
  filename: string;
  content: string;
  label: string;
  mimeType?: string;
  variant?: "signal";
}) {
  function go() {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  return (
    <button
      type="button"
      className={`btn ${variant === "signal" ? "btn-signal" : ""}`}
      onClick={go}
    >
      <Download size={12} strokeWidth={1.5} />
      {label}
    </button>
  );
}
