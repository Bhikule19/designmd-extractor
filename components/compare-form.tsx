"use client";

import * as React from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useCompareStore } from "@/lib/store";

const PRESETS: Array<[string, string]> = [
  ["stripe.com", "linear.app"],
  ["vercel.com", "github.com"],
  ["supabase.com", "tailwindcss.com"],
];

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function CompareForm() {
  const status = useCompareStore((s) => s.status);
  const urlA = useCompareStore((s) => s.urlA);
  const urlB = useCompareStore((s) => s.urlB);
  const setUrlA = useCompareStore((s) => s.setUrlA);
  const setUrlB = useCompareStore((s) => s.setUrlB);
  const startCompare = useCompareStore((s) => s.startCompare);
  const setSuccess = useCompareStore((s) => s.setSuccess);
  const setError = useCompareStore((s) => s.setError);

  const refA = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const t = setTimeout(() => refA.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const isLoading = status === "loading";

  async function run(a: string, b: string) {
    const A = normaliseUrl(a);
    const B = normaliseUrl(b);
    if (!A || !B) return;
    setUrlA(A);
    setUrlB(B);
    startCompare();
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlA: A, urlB: B }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError({
          side: json.side,
          url: json.url,
          error: json.error,
        });
        return;
      }
      setSuccess({ a: json.a, b: json.b, comparison: json.comparison });
    } catch (err) {
      setError({
        error: {
          code: "FETCH_FAILED",
          message: err instanceof Error ? err.message : "Network error",
        },
      });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!urlA.trim() || !urlB.trim()) return;
    run(urlA, urlB);
  }

  function tryPreset(a: string, b: string) {
    setUrlA(`https://${a}`);
    setUrlB(`https://${b}`);
    setTimeout(() => run(`https://${a}`, `https://${b}`), 100);
  }

  return (
    <div style={{ display: "grid", gap: 56 }}>
      <div style={{ display: "grid", gap: 28, maxWidth: 760 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="t-caption signal-text">// compare</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">two URLs · one diff</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">deterministic</span>
        </div>

        <h1 className="t-display">
          Two design systems,
          <br />
          <em
            style={{
              fontStyle: "normal",
              color: "var(--signal)",
              fontWeight: 500,
            }}
          >
            side by side.
          </em>
        </h1>

        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--fg-muted)",
            maxWidth: 580,
            margin: 0,
          }}
        >
          Paste two URLs. We extract both with the same deterministic pipeline,
          then align colours by perceptual distance and tokens by name. See
          what overlaps, what&apos;s unique, and how far apart two brands really are.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 880 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <PromptInput
            ref={refA}
            label="A"
            value={urlA}
            onChange={setUrlA}
            disabled={isLoading}
            placeholder="extract https://"
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--fg-faint)",
              padding: "0 4px",
            }}
          >
            vs
          </div>
          <PromptInput
            label="B"
            value={urlB}
            onChange={setUrlB}
            disabled={isLoading}
            placeholder="extract https://"
          />
        </div>

        <div
          className="row"
          style={{
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span className="t-caption">
            [ side-by-side · OKLCH ΔE2000 matched · BYOK prose disabled ]
          </span>
          <button
            type="submit"
            className="btn btn-signal"
            disabled={!urlA.trim() || !urlB.trim() || isLoading}
          >
            {isLoading ? "running…" : "run"}
            <ArrowRight size={13} strokeWidth={1.5} />
          </button>
        </div>
      </form>

      <div style={{ display: "grid", gap: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="t-caption">// try a pair</span>
          <hr className="div-dotted" style={{ flex: 1 }} />
        </div>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {PRESETS.map(([a, b]) => (
            <button
              key={`${a}-${b}`}
              type="button"
              className="btn btn-ghost"
              onClick={() => tryPreset(a, b)}
              disabled={isLoading}
            >
              {a}
              <span className="faint">vs</span>
              {b}
              <ArrowRight size={11} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const PromptInput = React.forwardRef<
  HTMLInputElement,
  {
    label: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    placeholder?: string;
  }
>(function PromptInput(
  { label, value, onChange, disabled, placeholder },
  ref
) {
  return (
    <div className="prompt-wrap">
      <span className="prompt-glyph">{label}</span>
      <input
        ref={ref}
        className="prompt-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        disabled={disabled}
      />
    </div>
  );
});

export function CompareToolbar() {
  const reset = useCompareStore((s) => s.reset);
  return (
    <button className="btn btn-ghost" onClick={() => reset()}>
      <RotateCcw size={12} strokeWidth={1.5} />
      new pair
    </button>
  );
}
