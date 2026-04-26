"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAiSettings } from "@/lib/store";
import { DEFAULT_MODELS, type AiProvider } from "@/lib/ai/providers";

const PROVIDER_LABEL: Record<AiProvider, string> = {
  openrouter: "OpenRouter",
  anthropic: "Anthropic",
  groq: "Groq",
};

export function AiProseDialog() {
  const settings = useAiSettings();
  const [open, setOpen] = React.useState(false);

  // Load persisted BYOK settings once on mount. We deliberately use getState()
  // and an empty dep array instead of selecting `load` from the store: the
  // `settings` object reference changes on every store update, so a [settings]
  // dep would re-run this effect forever (load() → set() → new reference →
  // effect re-fires → infinite loop, "Maximum update depth exceeded").
  React.useEffect(() => {
    useAiSettings.getState().load();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`pill ${settings.enabled ? "is-on" : ""}`}
          style={{ cursor: "pointer", padding: "5px 10px" }}
          title="byok openai key required"
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              background: settings.enabled
                ? "var(--signal)"
                : "var(--fg-faint)",
              display: "inline-block",
              borderRadius: "50%",
            }}
          />
          ai prose: {settings.enabled ? "on" : "off"}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Optional AI prose layer</DialogTitle>
          <DialogDescription>
            Bring your own API key. We never log or store it server-side.
            Settings are saved to this browser&apos;s localStorage only.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: "grid", gap: 14, padding: "8px 0" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span className="t-label">provider</span>
            <select
              value={settings.provider}
              onChange={(e) => {
                const next = e.target.value as AiProvider;
                settings.setProvider(next);
                settings.setModel(DEFAULT_MODELS[next]);
              }}
              className="input"
              style={{ height: 38 }}
            >
              {(Object.keys(PROVIDER_LABEL) as AiProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABEL[p]}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <span className="t-label">api key</span>
            <input
              type="password"
              placeholder="sk-..."
              value={settings.apiKey}
              onChange={(e) => settings.setApiKey(e.target.value)}
              className="input"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <span className="t-label">model</span>
            <input
              value={settings.model}
              onChange={(e) => settings.setModel(e.target.value)}
              className="input"
            />
            <span className="t-caption">
              default ·{" "}
              <code style={{ color: "var(--fg)" }}>
                {DEFAULT_MODELS[settings.provider]}
              </code>
            </span>
          </div>
        </div>

        <DialogFooter style={{ gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              settings.setEnabled(false);
              setOpen(false);
            }}
          >
            disable
          </button>
          <button
            type="button"
            className="btn btn-signal"
            onClick={() => {
              if (!settings.apiKey || settings.apiKey.length < 8) return;
              settings.setEnabled(true);
              setOpen(false);
            }}
            disabled={!settings.apiKey || settings.apiKey.length < 8}
          >
            enable ai prose
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
