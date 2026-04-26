import type { ExtractedTokens, ProvenanceEntry } from "@/lib/types";

interface ProvenanceJson {
  selector: string;
  property: string;
  weight: number;
}

interface DesignTokenLeaf {
  $value: string | number;
  $type: string;
  $description?: string;
  /**
   * Non-standard W3C extension. Lists the top CSS rules that declared this
   * token, so consumers can audit deterministic-extracted values.
   */
  $provenance?: ProvenanceJson[];
}

interface DesignTokenGroup {
  [key: string]: DesignTokenLeaf | DesignTokenGroup;
}

export function renderTokensJson(tokens: ExtractedTokens): DesignTokenGroup {
  const root: DesignTokenGroup = {};

  root.color = {
    primary: groupColors(tokens.colors.primary),
    neutral: groupColors(tokens.colors.neutral),
    semantic: groupColors(tokens.colors.semantic),
  };

  root.typography = tokens.typography.roles.reduce<DesignTokenGroup>(
    (acc, r) => {
      acc[r.role] = {
        fontFamily: { $value: r.family, $type: "fontFamily" },
        fontSize: { $value: `${r.size}px`, $type: "dimension" },
        fontWeight: { $value: r.weight, $type: "fontWeight" },
        lineHeight: { $value: r.lineHeight, $type: "number" },
      } satisfies DesignTokenGroup;
      return acc;
    },
    {}
  );

  root.spacing = tokens.spacing.reduce<DesignTokenGroup>((acc, s) => {
    acc[s.name] = {
      $value: `${s.value}${s.unit}`,
      $type: "dimension",
      $description: s.usage,
    };
    return acc;
  }, {});

  root.radius = tokens.radius.reduce<DesignTokenGroup>((acc, r) => {
    acc[r.name] = {
      $value: r.value === 9999 ? "9999px" : `${r.value}${r.unit}`,
      $type: "dimension",
      $description: r.usage,
    };
    return acc;
  }, {});

  root.shadow = tokens.shadows.reduce<DesignTokenGroup>((acc, s) => {
    acc[s.name] = {
      $value: s.value,
      $type: "shadow",
      $description: s.usage,
    };
    return acc;
  }, {});

  return root;
}

function groupColors(
  list: ExtractedTokens["colors"]["primary"]
): DesignTokenGroup {
  return list.reduce<DesignTokenGroup>((acc, t) => {
    const leaf: DesignTokenLeaf = {
      $value: t.hex,
      $type: "color",
      $description: t.usage,
    };
    if (t.provenance && t.provenance.length > 0) {
      leaf.$provenance = t.provenance.map(toProvenanceJson);
    }
    acc[t.name] = leaf;
    return acc;
  }, {});
}

function toProvenanceJson(p: ProvenanceEntry): ProvenanceJson {
  return {
    selector: p.selector,
    property: p.property,
    weight: Math.round(p.weight * 1000) / 1000,
  };
}

export function renderTokensJsonString(tokens: ExtractedTokens): string {
  return JSON.stringify(renderTokensJson(tokens), null, 2);
}
