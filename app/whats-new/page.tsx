export const metadata = {
  title: "What's new · DESIGN.md Extractor",
};

const ENTRIES: Array<{
  date: string;
  tag: "shipped" | "improvement" | "fix";
  title: string;
  body: string;
}> = [
  {
    date: "2026-04-26",
    tag: "shipped",
    title: "Initial release",
    body: "Paste any URL, extract a deterministic DESIGN.md with colour, typography, spacing, radius, elevation and component tokens — no model required. Optional BYOK AI prose layer for Overview, Components, and Voice notes.",
  },
];

export default function WhatsNewPage() {
  return (
    <section className="w-full max-w-3xl mx-auto px-6 py-12 space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-fg font-mono">
          Changelog
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">What&apos;s new</h1>
      </header>

      <ol className="space-y-10 border-l pl-6 ml-2">
        {ENTRIES.map((e, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[2.05rem] top-1.5 size-2.5 rounded-full bg-fg" />
            <p className="text-xs font-mono text-muted-fg">{e.date}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[10px] uppercase tracking-wider rounded-full border px-2 py-0.5 font-mono">
                {e.tag}
              </span>
              <h2 className="text-lg font-semibold tracking-tight">{e.title}</h2>
            </div>
            <p className="mt-2 text-sm text-muted-fg leading-relaxed">
              {e.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
