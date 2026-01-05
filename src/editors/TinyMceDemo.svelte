<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    DEFAULT_STYLE_MAPPING_RULES,
    mapInlineStylesToClasses,
  } from "../styleMappingRules";

  let textareaElem: HTMLTextAreaElement | null = null;
  let editorId = "tiny-demo";
  let codeContentElem: HTMLDivElement;
  let contentElem: HTMLDivElement;

  onMount(() => {
    const tinymce = (window as any).tinymce; // 👈 從 CDN 全域拿

    if (!tinymce) {
      console.error("window.tinymce 沒載到，請確認 index.html 有引入 CDN");
      return;
    }

    tinymce.init({
      target: textareaElem,
      // 或者 selector: `#${editorId}`,
      menubar: false,
      content_style: `
        a { color: #0093C1; text-decoration: inherit; font-weight: 700; }
        a[data-mce-selected],
        a[data-mce-selected="inline-boundary"] {
          background-color: transparent !important;
        }
      `,
      style_formats: [
        {
          title: "Custom Link Style",
          selector: "a",
          classes: "link-primary",
        },
      ],
      // 只保留「免費/開源」常用插件，避免 premium plugin not enabled 的警告。
      plugins: [
        "anchor",
        "autolink",
        "charmap",
        "code",
        "codesample",
        "emoticons",
        "link",
        "lists",
        "media",
        "searchreplace",
        "table",
        "visualblocks",
        "wordcount",
      ],
      toolbar:
        "undo redo | blocks forecolor backcolor | " +
        "bold italic underline strikethrough | " +
        "alignleft aligncenter alignright | " +
        "bullist numlist | link unlink table | ",
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
      ],
      setup(editor: any) {
        console.log("TinyMCE ready", editor);
      },
    });
  });

  // 自訂樣式對應規則
  function getHtmlWithInlineLinkStyle(content: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    doc.querySelectorAll("a").forEach((a) => {
      const style = a.getAttribute("style") ?? "";

      // 更精準地判斷是否已有 color: ...
      const hasInlineColor = /(^|;)\s*color\s*:/.test(style);

      if (!hasInlineColor) {
        const extra = "color: #0093C1;"; // 若你只在乎顏色就好
        const newStyle = style ? `${extra} ${style}` : extra;
        a.setAttribute("style", newStyle);
      }
    });

    return doc.body.innerHTML;
  }

  function getContent2() {
    const tinymce = (window as any).tinymce;
    if (tinymce && tinymce.activeEditor) {
      const content = tinymce.activeEditor.getContent();

      console.log(getHtmlWithInlineLinkStyle(content));

      // 這裡進行「全自動 mapping inline style -> class」
      const normalized = mapInlineStylesToClasses(
        content,
        DEFAULT_STYLE_MAPPING_RULES,
        { stripAllStylesByDefault: true } // 保險起見全部 style 拔掉
      );

      // console.log("Normalized Content:", normalized);

      if (contentElem) contentElem.innerHTML = normalized;
      if (codeContentElem) codeContentElem.textContent = normalized;
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
    Welcome to TinyMCE!
  </textarea>
  <div style="padding: 1rem">
    <p>Show Content</p>
    <div bind:this={codeContentElem} style="margin-bottom: 1rem"></div>
    <div
      bind:this={contentElem}
      style="padding: 1rem; border: 1px solid #ccc"
    ></div>
  </div>
</section>

<style>
  /* 自訂連結樣式（TinyMCE / innerHTML 內容不會帶 Svelte 的 scoped attribute，所以需用 global） */
  :global(.link-primary) {
    color: #0093c1;
    text-decoration: inherit;
    font-weight: 700;
  }

  /* TinyMCE palette -> mapped classes */
  :global(.text-back-white) {
    color: #ffffff;
  }
  :global(.text-back-black) {
    color: #0c0e1f;
  }
  :global(.text-back-gray) {
    color: #494a57;
  }
  :global(.text-memo) {
    color: #5e5f6b;
  }
  :global(.text-primary-link) {
    color: #0093c1;
  }
  :global(.text-address) {
    color: #00a59b;
  }

  :global(.bg-back-white) {
    background-color: #ffffff;
  }
  :global(.bg-back-black) {
    background-color: #0c0e1f;
  }
  :global(.bg-back-gray) {
    background-color: #494a57;
  }
  :global(.bg-memo) {
    background-color: #5e5f6b;
  }
  :global(.bg-primary-link) {
    background-color: #0093c1;
  }
  :global(.bg-address) {
    background-color: #00a59b;
  }

  :global(.table-default) {
    border-collapse: collapse;
    width: 100%;
  }
</style>
