"use client";

import { create } from "zustand";
import type { ExtractedTokens, ExtractionError } from "@/lib/types";
import type { AiProvider } from "@/lib/ai/providers";
import type { ComparisonResult } from "@/lib/compare";

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

interface CompareState {
  status: "idle" | "loading" | "success" | "error";
  urlA: string;
  urlB: string;
  a: ExtractedTokens | null;
  b: ExtractedTokens | null;
  comparison: ComparisonResult | null;
  error: { side?: "a" | "b"; url?: string; error: ExtractionError } | null;
  setUrlA: (v: string) => void;
  setUrlB: (v: string) => void;
  startCompare: () => void;
  setSuccess: (payload: {
    a: ExtractedTokens;
    b: ExtractedTokens;
    comparison: ComparisonResult;
  }) => void;
  setError: (e: CompareState["error"]) => void;
  reset: () => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  status: "idle",
  urlA: "",
  urlB: "",
  a: null,
  b: null,
  comparison: null,
  error: null,
  setUrlA: (urlA) => set({ urlA }),
  setUrlB: (urlB) => set({ urlB }),
  startCompare: () => set({ status: "loading", error: null }),
  setSuccess: ({ a, b, comparison }) =>
    set({ status: "success", a, b, comparison, error: null }),
  setError: (error) =>
    set({ status: "error", error, a: null, b: null, comparison: null }),
  reset: () =>
    set({
      status: "idle",
      urlA: "",
      urlB: "",
      a: null,
      b: null,
      comparison: null,
      error: null,
    }),
}));
