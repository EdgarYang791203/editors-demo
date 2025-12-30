<script lang="ts">
  import { onMount, onDestroy } from "svelte";

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
        "undo redo | blocks | " +
        "bold italic underline strikethrough forecolor backcolor | " +
        "alignleft aligncenter alignright | " +
        "bullist numlist | link unlink table | ",
      setup(editor: any) {
        console.log("TinyMCE ready", editor);
      },
    });
  });

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
      
      const styledContent = getHtmlWithInlineLinkStyle(content);

      if (contentElem) contentElem.innerHTML = styledContent;
      if (codeContentElem) codeContentElem.textContent = styledContent;
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
