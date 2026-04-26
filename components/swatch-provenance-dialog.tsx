"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ColorToken } from "@/lib/types";

export function SwatchProvenanceDialog({
  token,
  open,
  onOpenChange,
}: {
  token: ColorToken;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const oklch = token.oklch
    ? `oklch(${token.oklch.l.toFixed(2)} ${token.oklch.c.toFixed(3)} ${
        Number.isFinite(token.oklch.h)
          ? Math.round(((token.oklch.h % 360) + 360) % 360)
          : 0
      })`
    : null;
  const provenance = token.provenance ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: 560, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            background: token.hex,
            height: 96,
            borderBottom: "1px solid var(--border-subtle)",
          }}
        />
        <div style={{ padding: 24, display: "grid", gap: 18 }}>
          <DialogHeader style={{ gap: 6 }}>
            <DialogTitle
              style={{
                fontFamily: "var(--mono)",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {token.name}
            </DialogTitle>
            <DialogDescription
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                color: "var(--fg-muted)",
              }}
            >
              {token.usage}
            </DialogDescription>
          </DialogHeader>

          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "max-content 1fr",
              columnGap: 16,
              rowGap: 6,
              margin: 0,
              fontSize: 12,
              fontFamily: "var(--mono)",
            }}
          >
            <Row k="hex">
              <CopyableValue value={token.hex.toUpperCase()} />
            </Row>
            {oklch && (
              <Row k="oklch">
                <CopyableValue value={oklch} />
              </Row>
            )}
            <Row k="role">{token.role}</Row>
            {token.semanticKind && (
              <Row k="kind">{token.semanticKind}</Row>
            )}
            <Row k="cites">
              {token.occurrences} CSS rule
              {token.occurrences === 1 ? "" : "s"}
            </Row>
          </dl>

          <hr className="div-dotted" />

          <div style={{ display: "grid", gap: 8 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="t-caption">// declared by</span>
              <span className="t-caption faint">
                top {provenance.length} of {token.occurrences}
              </span>
            </div>
            {provenance.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--fg-subtle)",
                  fontFamily: "var(--mono)",
                }}
              >
                No provenance captured. The token was inferred from a header
                signal (theme-color / manifest) rather than a CSS rule.
              </p>
            ) : (
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--r-sm)",
                  overflow: "hidden",
                  background: "var(--surface)",
                }}
              >
                {provenance.map((p, i) => (
                  <li
                    key={`${p.selector}-${p.property}-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 12,
                      padding: "10px 12px",
                      borderBottom:
                        i < provenance.length - 1
                          ? "1px dashed var(--border-subtle)"
                          : "none",
                      alignItems: "center",
                    }}
                  >
                    <code
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "var(--fg)",
                        wordBreak: "break-all",
                        lineHeight: 1.5,
                      }}
                    >
                      {p.selector}
                    </code>
                    <span
                      className="pill"
                      style={{
                        background: "var(--surface-1)",
                        color: "var(--ai)",
                        borderColor: "rgba(184, 164, 234, 0.30)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.property}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p
            className="t-caption faint"
            style={{ margin: 0, fontSize: 10, lineHeight: 1.5 }}
          >
            Every value cites the CSS rule it came from. Nothing inferred by AI.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <>
      <dt
        style={{
          color: "var(--fg-subtle)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: 10,
          alignSelf: "center",
        }}
      >
        {k}
      </dt>
      <dd style={{ margin: 0, color: "var(--fg)" }}>{children}</dd>
    </>
  );
}

function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  function copy() {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <button
      type="button"
      onClick={copy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: 0,
        padding: 0,
        cursor: "pointer",
        color: "var(--fg)",
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontFeatureSettings: "'tnum' on",
      }}
      title="click to copy"
    >
      <span>{value}</span>
      {copied ? (
        <Check size={11} color="var(--signal)" strokeWidth={1.5} />
      ) : (
        <Copy size={11} color="var(--fg-faint)" strokeWidth={1.5} />
      )}
    </button>
  );
}
