"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import type {
  ColorPair,
  ComparisonResult,
  TypographyPair,
} from "@/lib/compare";
import type {
  ColorToken,
  ExtractedTokens,
  RadiusToken,
  ScaleToken,
  ShadowToken,
  TypographyRole,
} from "@/lib/types";
import { CompareToolbar } from "@/components/compare-form";

export function CompareResult({
  a,
  b,
  comparison,
}: {
  a: ExtractedTokens;
  b: ExtractedTokens;
  comparison: ComparisonResult;
}) {
  return (
    <div>
      <header
        style={{
          padding: "28px 0 18px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "grid",
          gap: 14,
        }}
      >
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <span className="t-caption signal-text">// diff</span>
          <span className="t-caption">
            {new Date(comparison.meta.fetchedAt).toUTCString()}
          </span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">deterministic</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 18,
            alignItems: "baseline",
          }}
        >
          <SiteHeading meta={comparison.meta.a} side="A" />
          <span
            className="t-caption"
            style={{ color: "var(--fg-faint)", fontSize: 14 }}
          >
            vs
          </span>
          <SiteHeading meta={comparison.meta.b} side="B" align="right" />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 18,
            fontFamily: "var(--mono)",
            fontSize: 12,
            color: "var(--fg-muted)",
          }}
        >
          <Stat
            label="colours · A"
            value={comparison.summary.colorsTotalA}
          />
          <Stat
            label="colours · B"
            value={comparison.summary.colorsTotalB}
          />
          <Stat
            label="shared colours"
            value={comparison.summary.colorsShared}
            tone="signal"
          />
          <Stat
            label="shared type roles"
            value={comparison.summary.typographyShared}
          />
          <Stat
            label="shared spacing"
            value={comparison.summary.spacingShared}
          />
          <Stat
            label="shared radii"
            value={comparison.summary.radiusShared}
          />
        </div>
      </header>

      <div style={{ padding: "10px 0" }}>
        <CompareToolbar />
      </div>

      <div style={{ display: "grid", gap: 56, padding: "32px 0 80px" }}>
        <ColorsSection title="Primary colours" diff={comparison.colors.primary} />
        <ColorsSection title="Neutral colours" diff={comparison.colors.neutral} />
        <ColorsSection title="Semantic colours" diff={comparison.colors.semantic} />
        <FontsSection diff={comparison.fonts} a={a} b={b} />
        <TypographySection diff={comparison.typography} />
        <ScaleSection
          title="Spacing"
          diff={comparison.spacing}
          format={fmtScale}
          unit="px"
        />
        <ScaleSection
          title="Border radius"
          diff={comparison.radius}
          format={fmtRadius}
          unit="px"
        />
        <ShadowsSection diff={comparison.shadows} />
      </div>
    </div>
  );
}

function SiteHeading({
  meta,
  side,
  align,
}: {
  meta: ComparisonResult["meta"]["a"];
  side: "A" | "B";
  align?: "right";
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 4,
        textAlign: align === "right" ? "right" : "left",
      }}
    >
      <span className="t-caption signal-text">// site {side}</span>
      <h1 className="t-h2" style={{ margin: 0 }}>
        {meta.name}
      </h1>
      <a
        className="btn-link"
        href={meta.url}
        target="_blank"
        rel="noreferrer noopener"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          justifyContent: align === "right" ? "flex-end" : "flex-start",
        }}
      >
        {meta.hostname}
        <ArrowUpRight size={11} strokeWidth={1.5} />
      </a>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "signal";
}) {
  return (
    <div className="col" style={{ gap: 2 }}>
      <span className="t-caption">{label}</span>
      <span
        className="tnum"
        style={{
          fontSize: 22,
          fontFamily: "var(--sans)",
          fontWeight: 500,
          color: tone === "signal" ? "var(--signal)" : "var(--fg)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Colours ─── */

function ColorsSection({
  title,
  diff,
}: {
  title: string;
  diff: ComparisonResult["colors"]["primary"];
}) {
  if (
    diff.aOnly.length === 0 &&
    diff.shared.length === 0 &&
    diff.bOnly.length === 0
  ) {
    return null;
  }
  return (
    <section>
      <SectionHeader
        title={title}
        meta={
          <>
            {diff.aOnly.length} <span className="faint">A</span> · {diff.shared.length} shared · {diff.bOnly.length} <span className="faint">B</span>
          </>
        }
      />
      <ThreeCol
        left={<ColorList tokens={diff.aOnly} marker="+" tone="a" />}
        middle={<SharedColorList pairs={diff.shared} />}
        right={<ColorList tokens={diff.bOnly} marker="+" tone="b" />}
      />
    </section>
  );
}

function ColorList({
  tokens,
  marker,
  tone,
}: {
  tokens: ColorToken[];
  marker: "+" | "-";
  tone: "a" | "b";
}) {
  if (tokens.length === 0) {
    return <Empty />;
  }
  return (
    <ul className="diff-list">
      {tokens.map((t) => (
        <li key={t.name + t.hex} className="diff-row">
          <span className={`diff-marker tone-${tone}`}>{marker}</span>
          <span
            className="swatch-dot"
            style={{ background: t.hex }}
            aria-hidden
          />
          <div className="diff-name">
            <span className="swatch-name">{t.name}</span>
            <span className="swatch-hex">{t.hex.toUpperCase()}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SharedColorList({ pairs }: { pairs: ColorPair[] }) {
  if (pairs.length === 0) return <Empty />;
  return (
    <ul className="diff-list">
      {pairs.map((p, i) => (
        <li key={i} className="diff-row diff-row--shared">
          <span className="diff-marker tone-shared">~</span>
          <span
            className="swatch-dot"
            style={{ background: p.a.hex }}
            aria-hidden
          />
          <span
            className="swatch-dot"
            style={{ background: p.b.hex }}
            aria-hidden
          />
          <div className="diff-name">
            <span className="swatch-name">
              {p.a.name === p.b.name ? p.a.name : `${p.a.name} ~ ${p.b.name}`}
            </span>
            <span className="swatch-hex">
              ΔE {p.deltaE.toFixed(1)} · {p.a.hex.toUpperCase()} ~{" "}
              {p.b.hex.toUpperCase()}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─── Fonts ─── */

function FontsSection({
  diff,
}: {
  diff: ComparisonResult["fonts"];
  a: ExtractedTokens;
  b: ExtractedTokens;
}) {
  if (
    diff.aOnly.length === 0 &&
    diff.shared.length === 0 &&
    diff.bOnly.length === 0
  ) {
    return null;
  }
  return (
    <section>
      <SectionHeader
        title="Font families"
        meta={
          <>
            {diff.aOnly.length} <span className="faint">A</span> · {diff.shared.length} shared · {diff.bOnly.length} <span className="faint">B</span>
          </>
        }
      />
      <ThreeCol
        left={<TextList items={diff.aOnly} marker="+" tone="a" />}
        middle={<TextList items={diff.shared} marker="~" tone="shared" />}
        right={<TextList items={diff.bOnly} marker="+" tone="b" />}
      />
    </section>
  );
}

function TextList({
  items,
  marker,
  tone,
}: {
  items: string[];
  marker: "+" | "-" | "~";
  tone: "a" | "b" | "shared";
}) {
  if (items.length === 0) return <Empty />;
  return (
    <ul className="diff-list">
      {items.map((it, i) => (
        <li key={i} className="diff-row">
          <span className={`diff-marker tone-${tone}`}>{marker}</span>
          <span style={{ fontFamily: it }}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Typography ─── */

function TypographySection({
  diff,
}: {
  diff: ComparisonResult["typography"];
}) {
  if (
    diff.aOnly.length === 0 &&
    diff.shared.length === 0 &&
    diff.bOnly.length === 0
  ) {
    return null;
  }
  return (
    <section>
      <SectionHeader
        title="Typography roles"
        meta={
          <>
            {diff.aOnly.length} <span className="faint">A</span> · {diff.shared.length} shared · {diff.bOnly.length} <span className="faint">B</span>
          </>
        }
      />
      <ThreeCol
        left={<RoleList roles={diff.aOnly} marker="+" tone="a" />}
        middle={<RolePairList pairs={diff.shared} />}
        right={<RoleList roles={diff.bOnly} marker="+" tone="b" />}
      />
    </section>
  );
}

function RoleList({
  roles,
  marker,
  tone,
}: {
  roles: TypographyRole[];
  marker: "+" | "-";
  tone: "a" | "b";
}) {
  if (roles.length === 0) return <Empty />;
  return (
    <ul className="diff-list">
      {roles.map((r) => (
        <li key={r.role} className="diff-row">
          <span className={`diff-marker tone-${tone}`}>{marker}</span>
          <div className="diff-name">
            <span className="swatch-name">{r.role}</span>
            <span className="swatch-hex">
              {r.size}px · {r.weight} · {r.family}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RolePairList({ pairs }: { pairs: TypographyPair[] }) {
  if (pairs.length === 0) return <Empty />;
  return (
    <ul className="diff-list">
      {pairs.map((p, i) => (
        <li key={i} className="diff-row diff-row--shared">
          <span className="diff-marker tone-shared">~</span>
          <div className="diff-name">
            <span className="swatch-name">{p.a.role}</span>
            <span className="swatch-hex">
              {p.a.size}/{p.b.size}px · {p.a.weight}/{p.b.weight} ·{" "}
              {p.deltas.sameFamily ? p.a.family : `${p.a.family} → ${p.b.family}`}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─── Generic scales (spacing / radius) ─── */

function fmtScale(t: ScaleToken): string {
  return `${t.value}${t.unit} · ${t.usage}`;
}

function fmtRadius(t: RadiusToken): string {
  const v = t.value === 9999 ? "full" : `${t.value}${t.unit}`;
  return `${v} · ${t.usage}`;
}

function ScaleSection<T extends { name: string; value: number; unit: string }>({
  title,
  diff,
  format,
  unit,
}: {
  title: string;
  diff: { aOnly: T[]; shared: { a: T; b: T }[]; bOnly: T[] };
  format: (t: T) => string;
  unit?: string;
}) {
  if (
    diff.aOnly.length === 0 &&
    diff.shared.length === 0 &&
    diff.bOnly.length === 0
  ) {
    return null;
  }
  return (
    <section>
      <SectionHeader
        title={title}
        meta={
          <>
            {diff.aOnly.length} <span className="faint">A</span> · {diff.shared.length} shared · {diff.bOnly.length} <span className="faint">B</span>
            {unit && (
              <>
                {" "}
                <span className="faint">·</span> matched within ±1{unit}
              </>
            )}
          </>
        }
      />
      <ThreeCol
        left={<ScaleList tokens={diff.aOnly} marker="+" tone="a" format={format} />}
        middle={<SharedScaleList pairs={diff.shared} format={format} />}
        right={<ScaleList tokens={diff.bOnly} marker="+" tone="b" format={format} />}
      />
    </section>
  );
}

function ScaleList<T extends { name: string }>({
  tokens,
  marker,
  tone,
  format,
}: {
  tokens: T[];
  marker: "+" | "-";
  tone: "a" | "b";
  format: (t: T) => string;
}) {
  if (tokens.length === 0) return <Empty />;
  return (
    <ul className="diff-list">
      {tokens.map((t, i) => (
        <li key={i} className="diff-row">
          <span className={`diff-marker tone-${tone}`}>{marker}</span>
          <div className="diff-name">
            <span className="swatch-name">{t.name}</span>
            <span className="swatch-hex">{format(t)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SharedScaleList<T extends { name: string }>({
  pairs,
  format,
}: {
  pairs: { a: T; b: T }[];
  format: (t: T) => string;
}) {
  if (pairs.length === 0) return <Empty />;
  return (
    <ul className="diff-list">
      {pairs.map((p, i) => (
        <li key={i} className="diff-row diff-row--shared">
          <span className="diff-marker tone-shared">~</span>
          <div className="diff-name">
            <span className="swatch-name">
              {p.a.name === p.b.name ? p.a.name : `${p.a.name} ~ ${p.b.name}`}
            </span>
            <span className="swatch-hex">
              {format(p.a)} ~ {format(p.b)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─── Shadows ─── */

function ShadowsSection({
  diff,
}: {
  diff: ComparisonResult["shadows"];
}) {
  if (
    diff.aOnly.length === 0 &&
    diff.shared.length === 0 &&
    diff.bOnly.length === 0
  ) {
    return null;
  }
  return (
    <section>
      <SectionHeader
        title="Elevation"
        meta={
          <>
            {diff.aOnly.length} <span className="faint">A</span> · {diff.shared.length} shared · {diff.bOnly.length} <span className="faint">B</span>
          </>
        }
      />
      <ThreeCol
        left={<ShadowList tokens={diff.aOnly} marker="+" tone="a" />}
        middle={<SharedShadowList pairs={diff.shared} />}
        right={<ShadowList tokens={diff.bOnly} marker="+" tone="b" />}
      />
    </section>
  );
}

function ShadowList({
  tokens,
  marker,
  tone,
}: {
  tokens: ShadowToken[];
  marker: "+" | "-";
  tone: "a" | "b";
}) {
  if (tokens.length === 0) return <Empty />;
  return (
    <ul className="diff-list">
      {tokens.map((t, i) => (
        <li key={i} className="diff-row">
          <span className={`diff-marker tone-${tone}`}>{marker}</span>
          <div className="diff-name">
            <span className="swatch-name">{t.name}</span>
            <span className="swatch-hex">{t.value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SharedShadowList({
  pairs,
}: {
  pairs: { a: ShadowToken; b: ShadowToken }[];
}) {
  if (pairs.length === 0) return <Empty />;
  return (
    <ul className="diff-list">
      {pairs.map((p, i) => (
        <li key={i} className="diff-row diff-row--shared">
          <span className="diff-marker tone-shared">~</span>
          <div className="diff-name">
            <span className="swatch-name">
              {p.a.name === p.b.name ? p.a.name : `${p.a.name} ~ ${p.b.name}`}
            </span>
            <span className="swatch-hex">{p.a.value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─── Layout primitives ─── */

function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta: React.ReactNode;
}) {
  return (
    <div
      className="row"
      style={{
        justifyContent: "space-between",
        marginBottom: 14,
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <h3 className="t-h3" style={{ color: "var(--fg)" }}>
        {title}
      </h3>
      <span className="t-caption">{meta}</span>
    </div>
  );
}

function ThreeCol({
  left,
  middle,
  right,
}: {
  left: React.ReactNode;
  middle: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr 1fr",
        gap: 0,
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
      }}
    >
      <ColumnHeader label="A only" tone="a" />
      <ColumnHeader label="shared" tone="shared" />
      <ColumnHeader label="B only" tone="b" align="right" />
      <div style={{ borderRight: "1px dashed var(--border-subtle)" }}>
        {left}
      </div>
      <div style={{ borderRight: "1px dashed var(--border-subtle)" }}>
        {middle}
      </div>
      <div>{right}</div>
    </div>
  );
}

function ColumnHeader({
  label,
  tone,
  align,
}: {
  label: string;
  tone: "a" | "b" | "shared";
  align?: "right";
}) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        borderRight:
          tone !== "b" ? "1px dashed var(--border-subtle)" : undefined,
        background: "var(--surface)",
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color:
          tone === "shared"
            ? "var(--signal)"
            : "var(--fg-muted)",
        textAlign: align === "right" ? "right" : "left",
      }}
    >
      {label}
    </div>
  );
}

function Empty() {
  return (
    <p
      className="t-caption"
      style={{
        color: "var(--fg-faint)",
        margin: 0,
        padding: "16px",
      }}
    >
      —
    </p>
  );
}
