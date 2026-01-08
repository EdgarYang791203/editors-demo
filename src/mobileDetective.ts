export type OSName =
  | "iOS"
  | "Android"
  | "Windows"
  | "macOS"
  | "Linux"
  | "Unknown";

export function detectOS(): OSName {
  if (typeof navigator === "undefined") return "Unknown";

  const ua = navigator.userAgent || "";
  const platform = (navigator as any).platform || "";

  // Android
  if (/Android/i.test(ua)) return "Android";

  // iOS (含 iPadOS 偽裝成 Mac)
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  const isIPadOSMacLike =
    platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;

  if (isIOSDevice || isIPadOSMacLike) return "iOS";

  // Windows
  if (/Win(dows )?/i.test(ua)) return "Windows";

  // macOS
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";

  // Linux
  if (/Linux/i.test(ua)) return "Linux";

  return "Unknown";
}

export const deviceOS: OSName = detectOS();

/**
 * 粗分語系：中文 or 英文為主
 */
export type ScriptGroup = "zh" | "en";

export function detectScriptGroup(): ScriptGroup {
  if (typeof navigator === "undefined") return "en";
  const lang = (navigator.language || "").toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

/**
 * 根據 OS 回傳中英兩組字體 stack
 *
 * 中文預設：Noto Sans TC
 * iOS / macOS：PingFang TC
 * Android / Windows：Microsoft JhengHei
 *
 * 英文預設：Roboto
 * iOS / macOS：Helvetica
 * Android / Windows：Arial
 */
export function getFontStacks(os: OSName) {
  const chineseBase = `"Noto Sans TC"`;
  const englishBase = `"Roboto"`;

  let chineseAlt: string;
  let englishAlt: string;

  switch (os) {
    case "iOS":
    case "macOS":
      chineseAlt = `"PingFang TC"`;
      englishAlt = "Helvetica";
      break;
    case "Android":
    case "Windows":
      chineseAlt = `"Microsoft JhengHei"`;
      englishAlt = "Arial";
      break;
    default:
      chineseAlt = `"Noto Sans TC"`;
      englishAlt = `"Roboto"`;
  }

  const chineseStack = `${chineseBase}, ${chineseAlt}, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  const englishStack = `${englishBase}, ${englishAlt}, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  return { chineseStack, englishStack };
}

/**
 * 綜合語系 + OS，給一個「這台最適合」的主字體 stack
 */
export function getPreferredFontStack(): string {
  const os = deviceOS;
  const { chineseStack, englishStack } = getFontStacks(os);
  const script = detectScriptGroup();
  return script === "zh" ? chineseStack : englishStack;
}
