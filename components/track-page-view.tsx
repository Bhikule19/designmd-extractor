"use client";

import * as React from "react";

type TrackBody =
  | { event: "compare_preset"; preset: string }
  | { event: "download_md" }
  | { event: "discover"; slug?: string };

/**
 * Tiny client-side beacon. Fires exactly once on mount, then unmounts
 * cleanly. Used by pages that are server-cached (so the server-side render
 * hits don't get counted) and by interactions whose KPI lives outside the
 * existing API routes.
 */
export function TrackPageView(props: TrackBody) {
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(props),
      keepalive: true,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function fireTrack(body: TrackBody): void {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
