"use client";

import { create } from "zustand";

export type Theme = "dark" | "light";

const STORAGE_KEY = "designmd-theme";

interface ThemeState {
  theme: Theme;
  /** True once we've read the user's saved preference (avoids hydration flash). */
  hydrated: boolean;
  toggle: () => void;
  set: (next: Theme) => void;
  /** Read the persisted preference and apply it to <html data-theme>. Idempotent. */
  load: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  hydrated: false,
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    apply(next);
    set({ theme: next, hydrated: true });
  },
  set: (next) => {
    apply(next);
    set({ theme: next, hydrated: true });
  },
  load: () => {
    if (typeof window === "undefined") return;
    let next: Theme = "dark";
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "dark" || raw === "light") next = raw;
    } catch {
      // ignore
    }
    apply(next);
    set({ theme: next, hydrated: true });
  },
}));

function apply(next: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
}

/**
 * Inline script that runs in the document <head> before React hydrates.
 * Reads the stored theme synchronously so the very first paint matches the
 * user's preference — no flash of the wrong palette.
 */
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
