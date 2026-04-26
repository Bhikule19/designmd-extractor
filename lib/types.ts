/**
 * Deterministic extraction output types.
 * Every field is derived from the target site's static CSS/HTML, never
 * from a model. AI-generated prose lives in a separate `ai` field that is
 * always optional.
 */

export type Hex = `#${string}`;

export type ColorRole = "primary" | "neutral" | "semantic";

export type SemanticKind = "error" | "warning" | "success" | "info";

/**
 * A single CSS rule that contributed to a token. Lets the UI prove
 * provenance — every value cites where it came from.
 */
export interface ProvenanceEntry {
  /** Full CSS selector text (truncated to a sane max length). */
  selector: string;
  /** The CSS property the colour appeared in (`color`, `background-color`, `--brand`, …). */
  property: string;
  /** The scoring weight this declaration contributed (post all multipliers). */
  weight: number;
}

export interface ColorToken {
  name: string;
  hex: Hex;
  oklch: { l: number; c: number; h: number };
  role: ColorRole;
  semanticKind?: SemanticKind;
  usage: string;
  occurrences: number;
  /** Top-N selectors that declared this colour. Empty if no DOM information was available. */
  provenance?: ProvenanceEntry[];
}

export interface FontStack {
  family: string;
  fallbacks: string[];
  source: "google-fonts" | "bunny-fonts" | "self-hosted" | "unknown";
  href?: string;
}

export interface TypographyRole {
  role:
    | "display"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "body"
    | "small"
    | "caption"
    | "code";
  family: string;
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing?: number;
}

export interface Typography {
  fonts: FontStack[];
  roles: TypographyRole[];
}

export interface ScaleToken {
  name: string;
  value: number;
  unit: "px" | "rem";
  usage: string;
}

export interface RadiusToken {
  name: "radius-sm" | "radius-md" | "radius-lg" | "radius-xl" | "radius-full";
  value: number;
  unit: "px" | "rem";
  usage: string;
}

export interface ShadowToken {
  name: "shadow-sm" | "shadow-md" | "shadow-lg";
  value: string;
  usage: string;
}

export interface ButtonSpec {
  variant: "primary" | "secondary" | "ghost";
  background: string;
  color: string;
  borderColor?: string;
  borderRadius: string;
  paddingY: string;
  paddingX: string;
  fontWeight: number;
  fontSize: string;
}

export interface InputSpec {
  background: string;
  color: string;
  borderColor: string;
  borderRadius: string;
  paddingY: string;
  paddingX: string;
  focusBorderColor?: string;
}

export interface CardSpec {
  background: string;
  borderColor: string;
  borderRadius: string;
  padding: string;
  shadow?: string;
}

export interface NavigationSpec {
  background: string;
  color: string;
  height?: string;
  isSticky: boolean;
}

export interface ComponentSpecs {
  buttons: ButtonSpec[];
  input?: InputSpec;
  card?: CardSpec;
  navigation?: NavigationSpec;
}

export interface Assets {
  faviconUrl?: string;
  ogImageUrl?: string;
  fontHrefs: string[];
}

export interface SiteMeta {
  url: string;
  hostname: string;
  name: string;
  tagline: string;
  fetchedAt: string;
}

export interface ExtractedTokens {
  meta: SiteMeta;
  colors: {
    primary: ColorToken[];
    neutral: ColorToken[];
    semantic: ColorToken[];
  };
  typography: Typography;
  spacing: ScaleToken[];
  radius: RadiusToken[];
  shadows: ShadowToken[];
  components: ComponentSpecs;
  assets: Assets;
  diagnostics: {
    htmlBytes: number;
    cssBytes: number;
    stylesheetCount: number;
    cssCustomPropertyCount: number;
    warnings: string[];
  };
}

export interface ExtractionError {
  code:
    | "FETCH_FAILED"
    | "INVALID_URL"
    | "TIMEOUT"
    | "TOO_LARGE"
    | "NO_CSS_FOUND"
    | "PARSE_FAILED";
  message: string;
  url?: string;
}

export type ExtractionResult =
  | { ok: true; tokens: ExtractedTokens }
  | { ok: false; error: ExtractionError };
