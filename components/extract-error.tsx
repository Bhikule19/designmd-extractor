"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useExtractStore } from "@/lib/store";

export function ExtractError() {
  const error = useExtractStore((s) => s.error);
  const reset = useExtractStore((s) => s.reset);
  if (!error) return null;
  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        border: "1px solid rgba(217, 106, 106, 0.4)",
        borderRadius: "var(--r-md)",
        background: "rgba(217, 106, 106, 0.06)",
        maxWidth: 760,
      }}
    >
      <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
        <AlertCircle size={14} color="var(--err)" strokeWidth={1.5} />
        <div style={{ flex: 1 }}>
          <p
            className="t-caption"
            style={{ color: "var(--err)", marginBottom: 4 }}
          >
            {error.code.replace(/_/g, " ")}
          </p>
          <p
            className="t-body-sm"
            style={{ color: "var(--fg)", margin: 0 }}
          >
            {error.message}
          </p>
          {error.url && (
            <p
              className="t-caption"
              style={{
                marginTop: 6,
                color: "var(--fg-faint)",
                wordBreak: "break-all",
              }}
            >
              {error.url}
            </p>
          )}
        </div>
        <button className="btn btn-ghost" onClick={reset}>
          <RotateCcw size={11} strokeWidth={1.5} />
          try again
        </button>
      </div>
    </div>
  );
}
