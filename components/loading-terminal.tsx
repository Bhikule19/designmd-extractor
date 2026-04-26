"use client";

import * as React from "react";

const LINES = [
  { delay: 0, render: (host: string) => <>fetching <em>https://{host}</em></> },
  {
    delay: 320,
    render: () => (
      <>
        following stylesheets <span className="faint">(reading link[rel=stylesheet])</span>
      </>
    ),
  },
  {
    delay: 720,
    render: () => (
      <>
        parsing CSS <span className="faint">·</span> walking AST{" "}
        <span className="faint">·</span> collecting custom properties
      </>
    ),
  },
  {
    delay: 1100,
    render: () => (
      <>
        clustering colours <span className="faint">·</span> ΔE2000 perceptual
      </>
    ),
  },
  {
    delay: 1380,
    render: () => (
      <>
        inferring type roles <span className="faint">·</span> body / heading / code
      </>
    ),
  },
  {
    delay: 1620,
    render: () => (
      <>
        extracting spacing <span className="faint">·</span> radius{" "}
        <span className="faint">·</span> elevation
      </>
    ),
  },
  {
    delay: 1820,
    render: () => (
      <>
        resolving brand intent <span className="faint">·</span>{" "}
        <em>--brand · --primary · --accent</em>
      </>
    ),
  },
  {
    delay: 2000,
    render: () => (
      <>
        done <span className="faint">·</span>{" "}
        <em>tokens written · cites attached · md emitted</em>
      </>
    ),
  },
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

export function LoadingTerminal({ url }: { url: string }) {
  const host = hostOf(url);
  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(() => setShown(i + 1), line.delay)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const pct = Math.min((shown / LINES.length) * 100, 100);

  return (
    <div style={{ paddingTop: 64, paddingBottom: 80, maxWidth: 820 }}>
      <div className="row" style={{ marginBottom: 20, gap: 10 }}>
        <span className="t-caption signal-text">// extracting</span>
        <span className="t-caption">{host}</span>
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
              <span className="msg">{line.render(host)}</span>
            </div>
          );
        })}
      </div>

      <div className="row" style={{ marginTop: 16, gap: 10 }}>
        <span className="t-caption faint">
          // each value cites its source rule. nothing inferred by ai.
        </span>
      </div>
    </div>
  );
}
