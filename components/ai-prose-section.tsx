"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiSettings } from "@/lib/store";
import type { ExtractedTokens } from "@/lib/types";
import type { ProseSection } from "@/lib/ai/prompts";

const TITLES: Record<ProseSection, string> = {
  overview: "Overview",
  components: "Component prose",
  guidelines: "Voice & application notes",
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
      setError(
        "Configure your API key in the AI prose dialog above to enable this."
      );
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
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-muted-fg" />
          <span className="text-xs uppercase tracking-wider text-muted-fg font-mono">
            {TITLES[section]} (AI-generated)
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Streaming…
            </>
          ) : text ? (
            "Regenerate"
          ) : (
            "Generate"
          )}
        </Button>
      </div>

      {!settings.enabled && !text && (
        <p className="text-xs text-muted-fg">
          AI prose is disabled. Click the AI prose button in the result toolbar to add an API key.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 break-all">{error}</p>
      )}

      {text && (
        <div className="prose-sm whitespace-pre-wrap text-sm leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
}
