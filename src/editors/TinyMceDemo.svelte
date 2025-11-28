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
      plugins: [
        "anchor",
        "autolink",
        "charmap",
        "codesample",
        "emoticons",
        "link",
        "lists",
        "media",
        "searchreplace",
        "table",
        "visualblocks",
        "wordcount",
        "checklist",
        "mediaembed",
        "casechange",
        "formatpainter",
        "pageembed",
        "a11ychecker",
        "tinymcespellchecker",
        "permanentpen",
        "powerpaste",
        "advtable",
        "advcode",
        "advtemplate",
        "ai",
        "uploadcare",
        "mentions",
        "tinycomments",
        "tableofcontents",
        "footnotes",
        "mergetags",
        "autocorrect",
        "typography",
        "inlinecss",
        "markdown",
        "importword",
        "exportword",
        "exportpdf",
      ],
      toolbar:
        "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat",
      tinycomments_mode: "embedded",
      tinycomments_author: "Author name",
      mergetags_list: [
        { value: "First.Name", title: "First Name" },
        { value: "Email", title: "Email" },
      ],
      ai_request: (request: any, respondWith: any) =>
        respondWith.string(() =>
          Promise.reject("See docs to implement AI Assistant")
        ),
      uploadcare_public_key: import.meta.env.VITE_TINY_MCE_UPLOAD_KEY || "",
      setup(editor: any) {
        console.log("TinyMCE ready", editor);
      },
    });
  });

  function getContent2() {
    const tinymce = (window as any).tinymce;
    if (tinymce && tinymce.activeEditor) {
      const content = tinymce.activeEditor.getContent();
      contentElem.innerHTML = content;
      codeContentElem.textContent = content;
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
