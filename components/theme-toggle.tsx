"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/theme";

/**
 * Two-state theme toggle. Reads the persisted preference once on mount via
 * the store's `load()` (the inline script in <head> has already applied the
 * data-theme attribute, so the visual state is correct from first paint —
 * we just have to sync the React state).
 */
export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const toggle = useThemeStore((s) => s.toggle);

  React.useEffect(() => {
    // Sync store state with the data-theme attribute the <head> script set.
    useThemeStore.getState().load();
  }, []);

  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      // Render a placeholder until we've loaded the persisted theme so the
      // server-rendered icon doesn't flash a different state than the
      // user's preference.
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        background: "transparent",
        border: 0,
        cursor: "pointer",
        color: "var(--fg-muted)",
        borderRadius: "var(--r-sm)",
        padding: 0,
        transition:
          "color 120ms var(--ease), background 120ms var(--ease)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--fg)";
        e.currentTarget.style.background = "var(--surface-1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--fg-muted)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      {hydrated ? (
        <Icon size={14} strokeWidth={1.5} />
      ) : (
        <span aria-hidden style={{ width: 14, height: 14 }} />
      )}
    </button>
  );
}
