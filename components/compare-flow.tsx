"use client";

import { useCompareStore } from "@/lib/store";
import { CompareForm } from "@/components/compare-form";
import { CompareLoading } from "@/components/compare-loading";
import { CompareResult } from "@/components/compare-result";
import { AlertCircle } from "lucide-react";

export function CompareFlow() {
  const status = useCompareStore((s) => s.status);
  const a = useCompareStore((s) => s.a);
  const b = useCompareStore((s) => s.b);
  const comparison = useCompareStore((s) => s.comparison);
  const error = useCompareStore((s) => s.error);
  const reset = useCompareStore((s) => s.reset);

  if (status === "loading") return <CompareLoading />;

  if (status === "success" && a && b && comparison) {
    return <CompareResult a={a} b={b} comparison={comparison} />;
  }

  return (
    <div style={{ paddingTop: 96, paddingBottom: 80 }}>
      <CompareForm />
      {error && (
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
          <div
            className="row"
            style={{ alignItems: "flex-start", gap: 10 }}
          >
            <AlertCircle size={14} color="var(--err)" strokeWidth={1.5} />
            <div style={{ flex: 1 }}>
              <p
                className="t-caption"
                style={{ color: "var(--err)", marginBottom: 4 }}
              >
                {error.error.code.replace(/_/g, " ")}
                {error.side ? ` · side ${error.side.toUpperCase()}` : ""}
              </p>
              <p
                className="t-body-sm"
                style={{ color: "var(--fg)", margin: 0 }}
              >
                {error.error.message}
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
            <button className="btn btn-ghost" onClick={() => reset()}>
              try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
