"use client";

import { UrlForm } from "@/components/url-form";
import { LoadingTerminal } from "@/components/loading-terminal";
import { ResultView } from "@/components/result-view";
import { ExtractError } from "@/components/extract-error";
import { useExtractStore } from "@/lib/store";

export function HomeFlow() {
  const status = useExtractStore((s) => s.status);
  const url = useExtractStore((s) => s.url);
  const tokens = useExtractStore((s) => s.tokens);

  if (status === "loading") {
    return <LoadingTerminal url={url} />;
  }

  if (status === "success" && tokens) {
    return <ResultView tokens={tokens} />;
  }

  return (
    <div style={{ paddingTop: 96, paddingBottom: 80 }}>
      <UrlForm />
      <ExtractError />
    </div>
  );
}
