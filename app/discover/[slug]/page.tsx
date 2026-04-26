import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResultView } from "@/components/result-view";
import { findDiscoverEntry } from "@/lib/discover";
import { extract } from "@/lib/extract";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findDiscoverEntry(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.name} · design.md/extractor`,
    description: `Design system extracted from ${entry.url}`,
  };
}

export default async function DiscoverDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findDiscoverEntry(slug);
  if (!entry) notFound();

  const result = await extract(entry.url);

  if (!result.ok) {
    return (
      <div style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 760 }}>
        <Link
          href="/discover"
          style={{
            color: "var(--fg-muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={12} strokeWidth={1.5} /> all examples
        </Link>
        <h1 className="t-h1">Extraction failed for {entry.name}</h1>
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid rgba(217, 106, 106, 0.4)",
            borderRadius: "var(--r-md)",
            background: "rgba(217, 106, 106, 0.06)",
          }}
        >
          <p
            className="t-caption"
            style={{ color: "var(--err)", marginBottom: 6 }}
          >
            {result.error.code.replace(/_/g, " ")}
          </p>
          <p className="t-body-sm" style={{ color: "var(--fg)", margin: 0 }}>
            {result.error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 0 }}>
      <div
        style={{
          padding: "12px 0",
          borderBottom: "1px dashed var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href="/discover"
          style={{
            color: "var(--fg-muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={12} strokeWidth={1.5} /> all examples
        </Link>
        <span className="t-caption">cached · revalidates daily</span>
      </div>
      <ResultView tokens={result.tokens} />
    </div>
  );
}
