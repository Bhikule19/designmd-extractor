"use client";

import * as React from "react";
import { useAiSettings } from "@/lib/store";
import type { ExtractedTokens } from "@/lib/types";
import type { ProseSection } from "@/lib/ai/prompts";

const TITLES: Record<ProseSection, string> = {
  overview: "overview",
  components: "components",
  guidelines: "voice & application notes",
};

export function AiProseSection({
  section,
  tokens,
}: {
  section: ProseSection;
  tokens: ExtractedTokens;
}) {
  const settings = useAiSettings();
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function generate() {
    if (!settings.enabled || !settings.apiKey) {
      setError("Configure your API key first.");
      return;
    }
    setLoading(true);
    setError(null);
    setText("");
    try {
      const response = await fetch("/api/prose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          tokens,
        }),
      });
      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => null);
        setError(err?.error?.message ?? `Request failed (${response.status})`);
        setLoading(false);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: 16,
        border: "1px dashed rgba(184, 164, 234, 0.30)",
        borderRadius: "var(--r-md)",
        background: "rgba(184, 164, 234, 0.04)",
        display: "grid",
        gap: 10,
      }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill is-ai">AI-GENERATED</span>
          <span className="t-caption" style={{ color: "var(--ai)" }}>
            {TITLES[section]} · {settings.provider} · {settings.model}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "streaming…" : text ? "regenerate" : "generate"}
        </button>
      </div>

      {error && (
        <p
          className="t-body-sm"
          style={{ color: "var(--err)", margin: 0, wordBreak: "break-all" }}
        >
          {error}
        </p>
      )}

      {text && (
        <p
          className="ai-mark"
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.65,
            color: "var(--fg)",
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
