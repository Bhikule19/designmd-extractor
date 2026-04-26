import type { ExtractedTokens, ColorToken } from "@/lib/types";

export function TokenPreview({ tokens }: { tokens: ExtractedTokens }) {
  const allColors = [
    ...tokens.colors.primary,
    ...tokens.colors.neutral,
    ...tokens.colors.semantic,
  ];

  return (
    <div className="space-y-12">
      <PreviewSection title="Colours" subtitle={`${allColors.length} tokens detected`}>
        <ColorGrid title="Primary" colors={tokens.colors.primary} />
        <ColorGrid title="Neutral" colors={tokens.colors.neutral} />
        <ColorGrid title="Semantic" colors={tokens.colors.semantic} />
      </PreviewSection>

      <PreviewSection title="Typography" subtitle={`${tokens.typography.roles.length} roles · ${tokens.typography.fonts.length} fonts`}>
        <div className="space-y-4">
          {tokens.typography.roles.map((role) => (
            <div
              key={role.role}
              className="flex items-baseline gap-6 border-b pb-4 last:border-b-0"
            >
              <span className="text-xs uppercase tracking-wider text-muted-fg w-24 shrink-0 font-mono">
                {role.role}
              </span>
              <span
                style={{
                  fontFamily: `${role.family}, system-ui`,
                  fontSize: Math.min(role.size, 48),
                  fontWeight: role.weight,
                  lineHeight: role.lineHeight,
                }}
              >
                The quick brown fox
              </span>
              <span className="ml-auto text-xs text-muted-fg font-mono shrink-0">
                {role.family} · {role.size}px · {role.weight}
              </span>
            </div>
          ))}
        </div>
      </PreviewSection>

      {tokens.spacing.length > 0 && (
        <PreviewSection title="Spacing" subtitle={`${tokens.spacing.length} steps`}>
          <div className="space-y-2">
            {tokens.spacing.map((s) => (
              <div key={s.name} className="flex items-center gap-4">
                <span className="text-xs font-mono w-20 text-muted-fg">{s.name}</span>
                <span className="text-xs font-mono w-16">{s.value}px</span>
                <div
                  className="h-3 bg-fg/80 rounded-sm"
                  style={{ width: Math.min(s.value, 200) }}
                />
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {tokens.radius.length > 0 && (
        <PreviewSection title="Radius" subtitle={`${tokens.radius.length} steps`}>
          <div className="flex flex-wrap gap-6">
            {tokens.radius.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div
                  className="size-16 border-2 border-fg/30 bg-muted"
                  style={{
                    borderRadius: r.value === 9999 ? "9999px" : `${r.value}px`,
                  }}
                />
                <span className="text-xs font-mono text-muted-fg">
                  {r.name}
                </span>
                <span className="text-xs font-mono">
                  {r.value === 9999 ? "full" : `${r.value}px`}
                </span>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {tokens.shadows.length > 0 && (
        <PreviewSection title="Elevation" subtitle={`${tokens.shadows.length} levels`}>
          <div className="flex flex-wrap gap-6">
            {tokens.shadows.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-2">
                <div
                  className="size-20 rounded-md bg-card border"
                  style={{ boxShadow: s.value }}
                />
                <span className="text-xs font-mono text-muted-fg">
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}
    </div>
  );
}

function PreviewSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-4 flex items-baseline justify-between border-b pb-2">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {subtitle && (
          <span className="text-xs text-muted-fg font-mono">{subtitle}</span>
        )}
      </header>
      {children}
    </section>
  );
}

function ColorGrid({ title, colors }: { title: string; colors: ColorToken[] }) {
  if (colors.length === 0) return null;
  return (
    <div className="mb-6">
      <h4 className="text-xs uppercase tracking-wider text-muted-fg mb-3 font-mono">
        {title}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {colors.map((c) => (
          <div
            key={c.name}
            className="rounded-md border overflow-hidden bg-card"
          >
            <div className="h-16" style={{ background: c.hex }} />
            <div className="p-2 text-xs space-y-0.5">
              <div className="font-mono truncate" title={c.name}>
                {c.name}
              </div>
              <div className="font-mono text-muted-fg">{c.hex}</div>
              <div className="text-muted-fg truncate" title={c.usage}>
                {c.usage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
