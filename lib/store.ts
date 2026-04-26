"use client";

import { create } from "zustand";
import type { ExtractedTokens, ExtractionError } from "@/lib/types";
import type { AiProvider } from "@/lib/ai/providers";

interface ExtractState {
  status: "idle" | "loading" | "success" | "error";
  tokens: ExtractedTokens | null;
  error: ExtractionError | null;
  url: string;
  setUrl: (url: string) => void;
  startExtract: () => void;
  setSuccess: (tokens: ExtractedTokens) => void;
  setError: (error: ExtractionError) => void;
  reset: () => void;
}

export const useExtractStore = create<ExtractState>((set) => ({
  status: "idle",
  tokens: null,
  error: null,
  url: "",
  setUrl: (url) => set({ url }),
  startExtract: () => set({ status: "loading", error: null }),
  setSuccess: (tokens) => set({ status: "success", tokens, error: null }),
  setError: (error) =>
    set({ status: "error", error, tokens: null }),
  reset: () =>
    set({ status: "idle", tokens: null, error: null, url: "" }),
}));

interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  model: string;
  enabled: boolean;
  setProvider: (provider: AiProvider) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setEnabled: (enabled: boolean) => void;
  load: () => void;
}

const STORAGE_KEY = "designmd-ai-settings";

export const useAiSettings = create<AiSettings>((set, get) => ({
  provider: "openrouter",
  apiKey: "",
  model: "anthropic/claude-haiku-4-5",
  enabled: false,
  setProvider: (provider) => {
    set({ provider });
    persist(get());
  },
  setApiKey: (apiKey) => {
    set({ apiKey });
    persist(get());
  },
  setModel: (model) => {
    set({ model });
    persist(get());
  },
  setEnabled: (enabled) => {
    set({ enabled });
    persist(get());
  },
  load: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      set({
        provider: parsed.provider ?? "openrouter",
        apiKey: parsed.apiKey ?? "",
        model: parsed.model ?? "anthropic/claude-haiku-4-5",
        enabled: parsed.enabled ?? false,
      });
    } catch {
      // ignore
    }
  },
}));

function persist(state: AiSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      provider: state.provider,
      apiKey: state.apiKey,
      model: state.model,
      enabled: state.enabled,
    })
  );
}
