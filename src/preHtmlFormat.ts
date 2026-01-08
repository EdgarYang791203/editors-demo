export function prettyPrintHtml(raw: string) {
  // 先把多餘空白壓掉（避免 TinyMCE 本身輸出很亂）
  let html = raw.replace(/\r\n/g, "\n").trim();

  // 在 tag 前後插入換行，讓它可縮排
  html = html.replace(/></g, ">\n<").replace(/\n\s*\n/g, "\n");

  const lines = html.split("\n");
  let indent = 0;

  const out = lines.map((line) => {
    const trimmed = line.trim();

    // </tag> 減縮排
    if (/^<\/.+>/.test(trimmed)) indent = Math.max(indent - 1, 0);

    const padded = "  ".repeat(indent) + trimmed;

    // <tag ...> 增縮排（排除單行自閉合/同時開關的）
    if (
      /^<[^/!][^>]*>$/.test(trimmed) &&
      !/\/>$/.test(trimmed) &&
      !/^<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(
        trimmed
      ) &&
      !/^<.*<\/.*>$/.test(trimmed)
    ) {
      indent += 1;
    }

    return padded;
  });

  return out.join("\n");
}
