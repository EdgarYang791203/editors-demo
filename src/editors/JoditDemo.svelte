<script lang="ts">
  import JoditEditor from "./JoditEditor.svelte";
  import {
    DEFAULT_STYLE_MAPPING_RULES,
    mapInlineStylesToClasses,
  } from "../styleMappingRules";
  import { detectScriptGroup } from "../mobileDetective";
  import { prettyPrintHtml } from "../preHtmlFormat";

  let content = "<p>Hello Jodit!</p>";
  let codeContentElem: HTMLElementTagNameMap["code"] | null = null;
  let contentElem: HTMLElement | null = null;

  let lastHtml = "";

  // 跟 TinyMCE demo 對齊：用語系 class 讓 .editor-content.lang-en 的 CSS 覆寫生效
  const scriptGroup = detectScriptGroup();

  // Jodit 設定：可以在這邊限制 toolbar / 顏色等
  const joditConfig = {
    buttons: [
      // ✅ baseline toolbar（其餘先保留註解，之後需要再開）
      "undo",
      "redo",
      "|",
      "styleSelect",
      "|",
      // "bold",
      // "italic",
      // "underline",
      // "strikethrough",
      "brush", // 顏色工具
      // "fontsize",
      "|",
      "left",
      "center",
      "right",
      // "justify",
      "|",
      // "ul",
      // "ol",
      "link",
      "table",
      // "source",
    ],
    // 顏色 palette：跟 TinyMCE demo 對齊
    colors: ["#FFFFFF", "#0C0E1F", "#494A57", "#5E5F6B", "#0093C1", "#00A59B"],

    // 移除 brush 下拉中的「瀏覽器小調色盤」(input[type=color])，只保留上面的 6 色
    showBrowserColorPicker: false,
  };

  const debugNormalize = true;

  function dumpContent() {
    // content 這裡就是 JoditEditor bind:value 出來的 HTML
    const normalized = mapInlineStylesToClasses(
      content,
      DEFAULT_STYLE_MAPPING_RULES,
      { stripAllStylesByDefault: true }
    );

    if (debugNormalize) {
      const aligns = normalized.match(/\btext-align-(left|center|right)\b/g) ?? [];
      console.groupCollapsed("[Normalize] dumpContent");
      console.log("before:", content);
      console.log("after:", normalized);
      console.log("text-align classes:", Array.from(new Set(aligns)));
      console.groupEnd();
    }

    // 預覽區：用 normalized
    if (contentElem) contentElem.innerHTML = normalized;

    // 文字區：顯示 pretty 的版本
    const pretty = prettyPrintHtml(normalized);
    lastHtml = pretty;

    if (codeContentElem) codeContentElem.textContent = pretty;
  }

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(lastHtml);
    } catch (e) {
      // fallback：有些環境 clipboard 會擋
      const ta = document.createElement("textarea");
      ta.value = lastHtml;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }
</script>

<section>
  <div>
    <h2>Jodit</h2>
    <button on:click={dumpContent} style="margin-bottom: 1rem">
      取得 HTML 內容
    </button>
  </div>

  <!-- Rich text editor -->
  <div
    class="editor-content"
    class:lang-zh={scriptGroup === "zh"}
    class:lang-en={scriptGroup === "en"}
    lang={scriptGroup === "zh" ? "zh-TW" : "en-US"}
  >
    <JoditEditor
      bind:value={content}
      config={joditConfig}
      debugLogStyleApply={false}
      debugHoldSync={false}
    />
  </div>

  <div
    bind:this={contentElem}
    class="html-output editor-content"
    class:lang-zh={scriptGroup === "zh"}
    class:lang-en={scriptGroup === "en"}
    lang={scriptGroup === "zh" ? "zh-TW" : "en-US"}
  ></div>

  <div class="code-block">
    <div class="code-toolbar">
      <span class="code-title">HTML Output</span>
      <button class="code-btn" on:click={copyHtml}>Copy</button>
    </div>
    <pre><code bind:this={codeContentElem}></code></pre>
  </div>
</section>

<style>
  .code-block,
  .html-output {
    margin-top: 1rem;
    border: 1px solid #e5e7eb; /* 淺灰邊框 */
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff; /* 白底 */
    tab-size: 2;
  }

  .html-output {
    padding: 1rem;
  }

  .code-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb; /* 淺灰工具列 */
  }

  .code-title {
    font-size: 12px;
    font-weight: 600;
    color: #374151; /* 深灰 */
  }

  .code-btn {
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #0c0e1f;
    cursor: pointer;
  }

  .code-btn:hover {
    background: #f3f4f6;
  }

  .code-block pre {
    margin: 0;
    padding: 12px;
    max-height: 280px;
    overflow: auto;
    line-height: 1.6;
    background: #ffffff;
    text-align: left;
  }

  .code-block code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
    color: #0c0e1f; /* 黑字 */
    white-space: pre;
  }
</style>
