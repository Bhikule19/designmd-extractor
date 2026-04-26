"use client";

import * as React from "react";
import { useCompareStore } from "@/lib/store";

const LINES = [
  { delay: 0, render: (a: string, b: string) => <>fetching <em>{a}</em> + <em>{b}</em> in parallel</> },
  { delay: 380, render: () => <>parsing both stylesheets <span className="faint">·</span> walking AST</> },
  { delay: 780, render: () => <>clustering colours <span className="faint">·</span> ΔE2000 perceptual</> },
  { delay: 1100, render: () => <>aligning typography by role · spacing by px</> },
  { delay: 1380, render: () => <>computing diff <span className="faint">·</span> a-only · shared · b-only</> },
  { delay: 1700, render: () => <>done <span className="faint">·</span> <em>diff written</em></> },
];

function ts(offsetMs: number): string {
  const d = new Date(1740000000000 + offsetMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

export function CompareLoading() {
  const urlA = useCompareStore((s) => s.urlA);
  const urlB = useCompareStore((s) => s.urlB);
  const a = hostOf(urlA);
  const b = hostOf(urlB);

  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(() => setShown(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const pct = Math.min((shown / LINES.length) * 100, 100);

  return (
    <div style={{ paddingTop: 64, paddingBottom: 80, maxWidth: 820 }}>
      <div className="row" style={{ marginBottom: 20, gap: 10 }}>
        <span className="t-caption signal-text">// comparing</span>
        <span className="t-caption">{a}</span>
        <span className="t-caption faint">vs</span>
        <span className="t-caption">{b}</span>
        <hr className="div-dotted" style={{ flex: 1 }} />
        <span className="t-caption">{pct.toFixed(0)}%</span>
      </div>

      <div className="term">
        {LINES.slice(0, shown).map((line, i) => {
          const isCurrent = i === shown - 1 && shown < LINES.length;
          const isDone = i < shown - 1;
          const className = `term-line${isCurrent ? " is-current" : ""}${
            isDone ? " is-done" : ""
          }`;
          return (
            <div key={i} className={className}>
              <span className="ts">[ {ts(line.delay)} ]</span>
              <span className="msg">{line.render(a, b)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
