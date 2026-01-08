type StyleMappingRule = {
  tag?: string | string[];
  match?: { prop: string; value?: string | RegExp }[];
  addClasses: string[];
  stripMatchedProps?: boolean;
  stripAllStyles?: boolean;
  preserveAllStyles?: boolean;
};

type MapOptions = {
  stripAllStylesByDefault?: boolean;
};

export const DEFAULT_STYLE_MAPPING_RULES: StyleMappingRule[] = [
  {
    tag: "A",
    addClasses: ["link-primary"],
    stripAllStyles: true,
  },
  {
    match: [{ prop: "text-align", value: /^left\b/i }],
    addClasses: ["text-align-left"],
    stripMatchedProps: true,
  },
  {
    match: [{ prop: "text-align", value: /^center\b/i }],
    addClasses: ["text-align-center"],
    stripMatchedProps: true,
  },
  {
    match: [{ prop: "text-align", value: /^right\b/i }],
    addClasses: ["text-align-right"],
    stripMatchedProps: true,
  },
  {
    tag: ["COL", "COLGROUP"],
    addClasses: [],
    // 讓表格欄寬（<col style="width: ...">）在 normalize 時也會被清掉
    // 如果你需要「保留」欄寬來維持排版，把這行改回 preserveAllStyles: true
    stripAllStyles: true,
  },
  {
    match: [
      {
        prop: "color",
        value: /#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/i,
      },
    ],
    addClasses: ["text-back-white"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "color",
        value: /#0c0e1f|rgb\(\s*12\s*,\s*14\s*,\s*31\s*\)/i,
      },
    ],
    addClasses: ["text-back-black"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "color",
        value: /#494a57|rgb\(\s*73\s*,\s*74\s*,\s*87\s*\)/i,
      },
    ],
    addClasses: ["text-back-gray"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "color",
        value: /#5e5f6b|rgb\(\s*94\s*,\s*95\s*,\s*107\s*\)/i,
      },
    ],
    addClasses: ["text-memo"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "color",
        value: /#0093c1|rgb\(\s*0\s*,\s*147\s*,\s*193\s*\)/i,
      },
    ],
    addClasses: ["text-primary-link"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "color",
        value: /#00a59b|rgb\(\s*0\s*,\s*165\s*,\s*155\s*\)/i,
      },
    ],
    addClasses: ["text-address"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "background-color",
        value: /#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/i,
      },
    ],
    addClasses: ["bg-back-white"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "background-color",
        value: /#0c0e1f|rgb\(\s*12\s*,\s*14\s*,\s*31\s*\)/i,
      },
    ],
    addClasses: ["bg-back-black"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "background-color",
        value: /#494a57|rgb\(\s*73\s*,\s*74\s*,\s*87\s*\)/i,
      },
    ],
    addClasses: ["bg-back-gray"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "background-color",
        value: /#5e5f6b|rgb\(\s*94\s*,\s*95\s*,\s*107\s*\)/i,
      },
    ],
    addClasses: ["bg-memo"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "background-color",
        value: /#0093c1|rgb\(\s*0\s*,\s*147\s*,\s*193\s*\)/i,
      },
    ],
    addClasses: ["bg-primary-link"],
    stripMatchedProps: true,
  },
  {
    match: [
      {
        prop: "background-color",
        value: /#00a59b|rgb\(\s*0\s*,\s*165\s*,\s*155\s*\)/i,
      },
    ],
    addClasses: ["bg-address"],
    stripMatchedProps: true,
  },
  {
    tag: "TABLE",
    addClasses: ["table-default"],
  },
  {
    tag: "TD",
    addClasses: ["td-default"],
  },
];

function parseStyle(styleText: string): Record<string, string> {
  const map: Record<string, string> = {};
  styleText.split(";").forEach((chunk) => {
    const [rawProp, rawValue] = chunk.split(":");
    if (!rawProp || !rawValue) return;
    const prop = rawProp.trim().toLowerCase();
    const value = rawValue.trim();
    if (prop) {
      map[prop] = value;
    }
  });
  return map;
}

function serializeStyle(styleMap: Record<string, string>): string {
  return Object.entries(styleMap)
    .map(([prop, value]) => `${prop}: ${value}`)
    .join("; ");
}

function normalizeTagName(tagName: string): string {
  return tagName.toUpperCase();
}

function isRuleApplicableToTag(
  rule: StyleMappingRule,
  tagName: string
): boolean {
  if (!rule.tag) return true;
  const t = normalizeTagName(tagName);

  if (typeof rule.tag === "string") {
    return normalizeTagName(rule.tag) === t;
  }
  return rule.tag.map(normalizeTagName).includes(t);
}

export function mapInlineStylesToClasses(
  html: string,
  rules: StyleMappingRule[],
  options: MapOptions = {}
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // We must also process elements that match rule tags even if they don't
  // have inline styles (e.g. <a> produced by editors).
  const allElements = Array.from(doc.body.querySelectorAll<HTMLElement>("*"));

  const candidates = allElements.filter((el) => {
    if (el.hasAttribute("style")) return true;
    return rules.some((rule) => isRuleApplicableToTag(rule, el.tagName));
  });

  candidates.forEach((el) => {
    const originalStyle = el.getAttribute("style") ?? "";
    const styleMap = parseStyle(originalStyle);
    const tagName = el.tagName;

    let classList = (el.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter(Boolean);

    let shouldStripAllStyles =
      options.stripAllStylesByDefault === true ? true : false;

    for (const rule of rules) {
      if (!isRuleApplicableToTag(rule, tagName)) continue;

      // If rule.match is omitted, treat it as "always matched" for that tag.
      let matched = true;

      if (rule.match && rule.match.length > 0) {
        for (const cond of rule.match) {
          const propName = cond.prop.toLowerCase();
          const currentValue = styleMap[propName];

          if (currentValue == null) {
            matched = false;
            break;
          }

          if (cond.value != null) {
            if (typeof cond.value === "string") {
              if (currentValue !== cond.value) {
                matched = false;
                break;
              }
            } else {
              if (!cond.value.test(currentValue)) {
                matched = false;
                break;
              }
            }
          }
        }
      }

      if (!matched) continue;

      classList.push(...rule.addClasses);

      if (rule.preserveAllStyles) {
        shouldStripAllStyles = false;
      }

      if (rule.stripAllStyles) {
        shouldStripAllStyles = true;
      } else if (rule.stripMatchedProps && rule.match) {
        for (const cond of rule.match) {
          const propName = cond.prop.toLowerCase();
          delete styleMap[propName];
        }
      }
    }

    if (classList.length > 0) {
      const unique = Array.from(new Set(classList));
      el.setAttribute("class", unique.join(" "));
    }

    if (shouldStripAllStyles) {
      el.removeAttribute("style");
    } else {
      const newStyle = serializeStyle(styleMap);
      if (newStyle) {
        el.setAttribute("style", newStyle);
      } else {
        el.removeAttribute("style");
      }
    }
  });

  return doc.body.innerHTML;
}
