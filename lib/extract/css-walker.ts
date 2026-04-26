import * as csstree from "css-tree";

export interface CssRule {
  selector: string;
  declarations: Record<string, string>;
}

export interface CssCustomProperty {
  name: string;
  value: string;
  selector: string;
}

export interface ParsedCss {
  rules: CssRule[];
  customProperties: CssCustomProperty[];
  raw: string;
}

export function parseCss(source: string): ParsedCss {
  const rules: CssRule[] = [];
  const customProperties: CssCustomProperty[] = [];

  let ast: csstree.CssNode;
  try {
    ast = csstree.parse(source, { parseValue: false, parseAtrulePrelude: false });
  } catch {
    return { rules, customProperties, raw: source };
  }

  csstree.walk(ast, (node) => {
    if (node.type !== "Rule") return;
    const selector = csstree.generate(node.prelude);
    const declarations: Record<string, string> = {};

    if (node.block && "children" in node.block) {
      node.block.children.forEach((decl) => {
        if (decl.type !== "Declaration") return;
        const property = decl.property;
        const value = decl.value
          ? csstree.generate(decl.value)
          : "";
        if (!property || !value) return;
        declarations[property] = value;

        if (property.startsWith("--")) {
          customProperties.push({
            name: property,
            value: value.trim(),
            selector,
          });
        }
      });
    }

    if (Object.keys(declarations).length > 0) {
      rules.push({ selector, declarations });
    }
  });

  return { rules, customProperties, raw: source };
}

export function rulesMatching(
  rules: CssRule[],
  predicate: (selector: string) => boolean
): CssRule[] {
  return rules.filter((r) => predicate(r.selector));
}

const COLOR_DECL_PROPERTIES = new Set([
  "color",
  "background",
  "background-color",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "fill",
  "stroke",
  "caret-color",
  "text-decoration-color",
]);

export function isColorProperty(property: string): boolean {
  return COLOR_DECL_PROPERTIES.has(property);
}
