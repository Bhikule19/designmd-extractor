"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { useExtractStore } from "@/lib/store";
import type { ExtractionResult } from "@/lib/types";

const EXAMPLES = [
  "stripe.com",
  "linear.app",
  "vercel.com",
  "supabase.com",
  "tailwindcss.com",
  "resend.com",
  "raycast.com",
];

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function UrlForm() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState("");
  const startExtract = useExtractStore((s) => s.startExtract);
  const setSuccess = useExtractStore((s) => s.setSuccess);
  const setError = useExtractStore((s) => s.setError);
  const setUrlInStore = useExtractStore((s) => s.setUrl);
  const status = useExtractStore((s) => s.status);
  const isLoading = status === "loading";

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  async function run(rawUrl: string) {
    const url = normaliseUrl(rawUrl);
    if (!url) return;
    setUrlInStore(url);
    startExtract();
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json()) as ExtractionResult;
      if (!json.ok) {
        setError(json.error);
        return;
      }
      setSuccess(json.tokens);
    } catch (err) {
      setError({
        code: "FETCH_FAILED",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    run(value);
  }

  function tryExample(host: string) {
    const url = `https://${host}`;
    setValue(url);
    setTimeout(() => run(url), 100);
  }

  return (
    <div style={{ display: "grid", gap: 56 }}>
      <div style={{ display: "grid", gap: 28, maxWidth: 760 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="t-caption signal-text">// extractor v0.1.0</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">deterministic</span>
          <span className="t-caption faint">·</span>
          <span className="t-caption">BYOK ai optional</span>
        </div>

        <h1 className="t-display">
          Design tokens
          <br />
          extracted from the
          <br />
          source, not
          <br />
          <em
            style={{
              fontStyle: "normal",
              color: "var(--signal)",
              fontWeight: 500,
            }}
          >
            imagined.
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
          Paste a URL. We parse the real CSS — colours, type, spacing, radius —
          and emit a verifiable{" "}
          <code
            style={{
              color: "var(--fg)",
              background: "var(--surface-1)",
              padding: "1px 6px",
              borderRadius: 2,
            }}
          >
            DESIGN.md
          </code>
          . No vision model. No invented hex codes. No hallucinations.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 760 }}
      >
        <div className="prompt-wrap">
          <span className="prompt-glyph">$</span>
          <input
            ref={inputRef}
            className="prompt-input"
            placeholder="extract https://"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="prompt-submit"
            disabled={!value.trim() || isLoading}
          >
            run
            <ArrowRight size={13} strokeWidth={1.5} />
          </button>
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
            [ extractor v0.1.0 · deterministic · BYOK ai optional ]
          </span>
          <span className="t-caption">
            press <span className="kbd">↵</span> to run
          </span>
        </div>
      </form>

      <div style={{ display: "grid", gap: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="t-caption">// try one</span>
          <hr className="div-dotted" style={{ flex: 1 }} />
        </div>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {EXAMPLES.map((h) => (
            <button
              key={h}
              type="button"
              className="btn btn-ghost"
              onClick={() => tryExample(h)}
              disabled={isLoading}
            >
              {h}
              <ArrowRight size={11} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 18, marginTop: 24 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="t-caption">// how it works</span>
          <hr className="div-dotted" style={{ flex: 1 }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 0,
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--r-md)",
          }}
        >
          {[
            {
              n: "01",
              t: "fetch",
              d: "follow stylesheets, inline <style>, computed properties — no screenshots.",
            },
            {
              n: "02",
              t: "parse",
              d: "real CSS AST. count rules, find custom properties, group declarations.",
            },
            {
              n: "03",
              t: "cluster",
              d: "collapse near-duplicate colours into perceptual clusters with usage counts.",
            },
            {
              n: "04",
              t: "emit",
              d: "DESIGN.md + W3C tokens.json. every value cites the rule it came from.",
            },
          ].map((s, i, arr) => (
            <div
              key={s.n}
              style={{
                padding: 18,
                borderRight:
                  i < arr.length - 1 ? "1px dashed var(--border)" : 0,
                display: "grid",
                gap: 8,
              }}
            >
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="t-caption signal-text">{s.n}</span>
                <span className="t-label">{s.t}</span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "var(--fg-muted)",
                }}
              >
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
