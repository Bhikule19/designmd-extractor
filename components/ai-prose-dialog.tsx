"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAiSettings } from "@/lib/store";
import { DEFAULT_MODELS, type AiProvider } from "@/lib/ai/providers";

const PROVIDER_LABEL: Record<AiProvider, string> = {
  openrouter: "OpenRouter",
  anthropic: "Anthropic",
  groq: "Groq",
};

export function AiProseDialog() {
  const settings = useAiSettings();
  React.useEffect(() => {
    settings.load();
  }, [settings]);

  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="size-3.5" />
          {settings.enabled ? "AI prose: on" : "AI prose: off"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Optional AI prose layer</DialogTitle>
          <DialogDescription>
            Bring your own API key. We never log or store it server-side. Settings
            are saved locally to this browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              value={settings.provider}
              onChange={(e) => {
                const next = e.target.value as AiProvider;
                settings.setProvider(next);
                settings.setModel(DEFAULT_MODELS[next]);
              }}
              className="flex h-11 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {(Object.keys(PROVIDER_LABEL) as AiProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABEL[p]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={settings.apiKey}
              onChange={(e) => settings.setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={settings.model}
              onChange={(e) => settings.setModel(e.target.value)}
            />
            <p className="text-xs text-muted-fg">
              Default: <code className="font-mono">{DEFAULT_MODELS[settings.provider]}</code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              settings.setEnabled(false);
              setOpen(false);
            }}
          >
            Disable
          </Button>
          <Button
            onClick={() => {
              if (!settings.apiKey || settings.apiKey.length < 8) return;
              settings.setEnabled(true);
              setOpen(false);
            }}
            disabled={!settings.apiKey || settings.apiKey.length < 8}
          >
            Enable AI prose
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
