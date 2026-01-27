<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    DEFAULT_STYLE_MAPPING_RULES,
    mapInlineStylesToClasses,
  } from "../styleMappingRules";
  import {
    deviceOS,
    getFontStacks,
    getPreferredFontStack,
    detectScriptGroup,
  } from "../mobileDetective";
  import { prettyPrintHtml } from "../preHtmlFormat";

  import globalEditorCssUrl from "../assets/global-editor.css?url";

  let textareaElem: HTMLTextAreaElement | null = null;
  let editorId = "tiny-demo";
  let rawCodeElem: HTMLElementTagNameMap["code"] | null = null;
  let normalizedCodeElem: HTMLElementTagNameMap["code"] | null = null;
  let rawContentElem: HTMLElement | null = null;
  let normalizedContentElem: HTMLElement | null = null;

  // 給 editor / 預覽用的字體
  let preferredFontStack = "";

  // 🔍 debug 用資訊
  let osName = "";
  let scriptGroup = "";
  let chineseStack = "";
  let englishStack = "";
  let editorFont = "";
  let rawPreviewFont = "";
  let normalizedPreviewFont = "";

  let editorInstance: any = null;

  function updateFontDebug() {
    // 實際 TinyMCE iframe body 的 font-family
    if (editorInstance) {
      const body = editorInstance.getBody?.();
      if (body instanceof Element) {
        const cs = getComputedStyle(body);
        editorFont = cs.fontFamily;
      }
    }

    // 預覽區容器的 font-family（raw / normalized 各自一份）
    if (rawContentElem instanceof Element) {
      const cs = getComputedStyle(rawContentElem);
      rawPreviewFont = cs.fontFamily;
    }
    if (normalizedContentElem instanceof Element) {
      const cs = getComputedStyle(normalizedContentElem);
      normalizedPreviewFont = cs.fontFamily;
    }
  }

  onMount(() => {
    const tinymce = (window as any).tinymce; // 👈 從 CDN 全域拿

    if (!tinymce) {
      console.error("window.tinymce 沒載到，請確認 index.html 有引入 CDN");
      return;
    }

    // 1️⃣ 設定偵測結果
    osName = deviceOS;
    scriptGroup = detectScriptGroup();
    preferredFontStack = getPreferredFontStack();
    const stacks = getFontStacks(deviceOS);
    chineseStack = stacks.chineseStack;
    englishStack = stacks.englishStack;

    // ✅ 改 styles 下拉在「尚未選擇樣式」時的預設字樣（TinyMCE 預設會顯示 Formats）
    // 這是透過覆寫 i18n key 來做（key 就是原始英文字串 "Formats"）
    const stylesToolbarLabel = scriptGroup === "zh" ? "選擇樣式" : "Styles";
    tinymce.addI18n("en", { Formats: stylesToolbarLabel });
    tinymce.addI18n("en_US", { Formats: stylesToolbarLabel });
    tinymce.addI18n("zh_TW", { Formats: stylesToolbarLabel });

    const pickLocalImageAsDataUrl = (cb: any) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          if (typeof dataUrl === "string") {
            cb(dataUrl, { title: file.name });
          }
        };
        reader.readAsDataURL(file);
      };

      input.click();
    };

    tinymce.init({
      target: textareaElem,
      menubar: false,
      body_class: "editor-content editor-iframe",
      content_css: [globalEditorCssUrl],
      content_style: `
        body {
          font-family: ${preferredFontStack};
        }
      `,
      // 讓 styles 下拉的項目互斥（避免多勾/疊 class）
      // 關鍵：用 attributes.class 取代 classes，避免 class 被 append 疊加
      formats: {
        customD1: { block: "div", attributes: { class: "custom-d1" } },
        customD2: { block: "div", attributes: { class: "custom-d2" } },

        // 圖片 + 文字同列（不覆蓋既有 class，改用 selector + classes）
        imgTextInline: { selector: "p", classes: "img-text-inline" },

        headingH1: { block: "h1", attributes: { class: "heading-h1" } },
        headingH2: { block: "h2", attributes: { class: "heading-h2" } },
        headingH3: { block: "h3", attributes: { class: "heading-h3" } },
        headingH4: { block: "h4", attributes: { class: "heading-h4" } },
        headingH5: { block: "h5", attributes: { class: "heading-h5" } },
        headingH6: { block: "h6", attributes: { class: "heading-h6" } },

        subheading1: { block: "h2", attributes: { class: "subheading" } },
        subheading2: { block: "h2", attributes: { class: "subheading2" } },
        subheadingSecondary1: {
          block: "h3",
          attributes: { class: "subheading-secondary" },
        },
        subheadingSecondary2: {
          block: "h3",
          attributes: { class: "subheading-secondary2" },
        },

        content1: { block: "p", attributes: { class: "content-1" } },
        content2: { block: "p", attributes: { class: "content-2" } },
        description: { block: "p", attributes: { class: "description" } },
      },
      style_formats: [
        {
          title: "圖文同列(置中)",
          format: "imgTextInline",
        },
        {
          title: "醒目 D1",
          format: "customD1",
        },
        {
          title: "醒目 D2",
          format: "customD2",
        },
        {
          title: "標題 H1",
          format: "headingH1",
        },
        {
          title: "標題 H2",
          format: "headingH2",
        },
        {
          title: "標題 H3",
          format: "headingH3",
        },
        {
          title: "標題 H4",
          format: "headingH4",
        },
        {
          title: "標題 H5",
          format: "headingH5",
        },
        {
          title: "標題 H6",
          format: "headingH6",
        },
        {
          title: "內文標題1",
          format: "subheading1",
        },
        {
          title: "內文次要標題1",
          format: "subheadingSecondary1",
        },
        {
          title: "內文1",
          format: "content1",
        },
        {
          title: "內文標題2",
          format: "subheading2",
        },
        {
          title: "內文次要標題2",
          format: "subheadingSecondary2",
        },
        {
          title: "內文2",
          format: "content2",
        },
        {
          title: "說明文字",
          format: "description",
        },
        // {
        //   title: "Custom Link Style",
        //   selector: "a",
        //   classes: "link-primary",
        // },
      ],
      plugins: [
        "anchor",
        "autolink",
        "charmap",
        "code",
        "codesample",
        "emoticons",
        "image",
        "link",
        "lists",
        "media",
        "searchreplace",
        "table",
        "visualblocks",
        "wordcount",
      ],
      // ✅ baseline toolbar（其餘先保留註解，之後需要再開）
      toolbar: [
        "undo redo",
        "styles forecolor",
        // "bold italic underline strikethrough",
        "alignleft aligncenter alignright",
        // "bullist numlist",
        "link unlink image table",
        // "code",
      ].join(" | "),
      file_picker_types: "image",
      paste_data_images: true,
      automatic_uploads: false,
      file_picker_callback: (cb: any, _value: any, meta: any) => {
        if (meta?.filetype !== "image") return;
        pickLocalImageAsDataUrl(cb);
      },
      color_map: [
        "#FFFFFF",
        "Back White",
        "#0C0E1F",
        "Back Black",
        "#494A57",
        "Back Gray",
        "#5E5F6B",
        "Memo",
        "#0093C1",
        "Primary Link",
        "#00A59B",
        "Address",
        "#eef0f0",
        "Back Light Gray",
      ],
      color_cols: 4,
      custom_colors: false,
      setup(editor: any) {
        editorInstance = editor;
        // 每次內容變更時更新 debug 資訊

        editor.on("init", () => {
          const lang = scriptGroup === "zh" ? "zh-TW" : "en-US";
          editor.getBody().setAttribute("lang", lang);

          // init 完、iframe body 存在後再讀一次實際字體
          setTimeout(updateFontDebug, 0);
        });
      },
    });
  });

  let lastRawHtml = "";
  let lastNormalizedHtml = "";

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // fallback：有些環境 clipboard 會擋
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  async function copyRawHtml() {
    await copyText(lastRawHtml);
  }

  async function copyNormalizedHtml() {
    await copyText(lastNormalizedHtml);
  }

  function getContent2() {
    const tinymce = (window as any).tinymce;
    if (tinymce && tinymce.activeEditor) {
      const content = tinymce.activeEditor.getContent();

      const normalized = mapInlineStylesToClasses(
        content,
        DEFAULT_STYLE_MAPPING_RULES,
        { stripAllStylesByDefault: true }
      );

      // 預覽區：raw / normalized 都顯示，方便比對「少了什麼」
      if (rawContentElem) rawContentElem.innerHTML = content;
      if (normalizedContentElem) normalizedContentElem.innerHTML = normalized;

      // code 區：各自 pretty print
      const prettyRaw = prettyPrintHtml(content);
      const prettyNormalized = prettyPrintHtml(normalized);

      lastRawHtml = prettyRaw;
      lastNormalizedHtml = prettyNormalized;

      if (rawCodeElem) rawCodeElem.textContent = prettyRaw;
      if (normalizedCodeElem) normalizedCodeElem.textContent = prettyNormalized;

      // 預覽渲染後再抓一次 font debug
      setTimeout(updateFontDebug, 0);
    } else {
      console.error("tinymce or activeEditor not available");
    }
  }

  onDestroy(() => {
    const tinymce = (window as any).tinymce;
    if (tinymce) {
      tinymce.remove(); // 清掉所有 instance，或傳 id
    }
  });
</script>

<section>
  <div>
    <h2>TinyMCE</h2>
    <button on:click={getContent2} style="margin-bottom: 1rem">
      取得 HTML 內容
    </button>
  </div>
  <textarea bind:this={textareaElem} id={editorId}>
  </textarea>

  <h3 style="margin: 1rem 0 0.5rem">Raw Output（含 inline style）</h3>
  <div
    bind:this={rawContentElem}
    class="html-output editor-content"
    class:lang-zh={scriptGroup === "zh"}
    class:lang-en={scriptGroup === "en"}
    lang={scriptGroup === "zh" ? "zh-TW" : "en-US"}
  ></div>
  <div class="code-block">
    <div class="code-toolbar">
      <span class="code-title">Raw HTML</span>
      <button class="code-btn" on:click={copyRawHtml}>Copy</button>
    </div>
    <pre><code bind:this={rawCodeElem}></code></pre>
  </div>

  <h3 style="margin: 1.25rem 0 0.5rem">Normalized Output（inline style → class）</h3>
  <div
    bind:this={normalizedContentElem}
    class="html-output editor-content"
    class:lang-zh={scriptGroup === "zh"}
    class:lang-en={scriptGroup === "en"}
    lang={scriptGroup === "zh" ? "zh-TW" : "en-US"}
  ></div>
  <div class="code-block">
    <div class="code-toolbar">
      <span class="code-title">Normalized HTML</span>
      <button class="code-btn" on:click={copyNormalizedHtml}>Copy</button>
    </div>
    <pre><code bind:this={normalizedCodeElem}></code></pre>
  </div>

  <!-- 🔍 Debug 面板：demo 給客戶看的重點 -->
  <div
    style="margin: 1.5rem 0; padding: 1rem; border: 1px dashed #ccc; font-size: 12px;"
  >
    <h3 style="margin-top: 0; font-size: 14px;">
      Font Debug Info（只給開發 / demo 用）
    </h3>
    <p>Detected OS: <strong>{osName}</strong></p>
    <p>Detected Script Group: <strong>{scriptGroup}</strong></p>
    <p>Preferred Font Stack: <code>{preferredFontStack}</code></p>
    <p>Chinese Stack: <code>{chineseStack}</code></p>
    <p>English Stack: <code>{englishStack}</code></p>
    <p>Editor body font-family: <code>{editorFont}</code></p>
    <p>Raw preview font-family: <code>{rawPreviewFont}</code></p>
    <p>Normalized preview font-family: <code>{normalizedPreviewFont}</code></p>
    <button on:click={updateFontDebug}>重新檢查字體</button>
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
