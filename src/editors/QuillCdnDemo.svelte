<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let editorElem: HTMLDivElement;
  let codeContentElem: HTMLDivElement;
  let contentElem: HTMLDivElement;
  let quill: any;

  onMount(() => {
    const Quill = (window as any).Quill;

    if (!Quill) {
      console.error("window.Quill 沒有載入，請確認 index.html 是否有引入 CDN");
      return;
    }

    if (!editorElem) {
      console.error("editorElem 為 null，無法初始化 Quill");
      return;
    }

    // ✅ 這裡改用 DOM element，不再用 "#editor" 字串
    quill = new Quill(editorElem, {
      modules: {
        toolbar: [
          ["bold", "italic"],
          ["link", "blockquote", "code-block", "image"],
          [{ list: "ordered" }, { list: "bullet" }],
        ],
      },
      theme: "snow",
    });
  });

  onDestroy(() => {
    quill = null;
  });

  function getContent() {
    if (!quill || !editorElem || !contentElem || !codeContentElem) return;

    const delta = quill.getContents();

    const html = deltaToHtml(delta);

    // 顯示渲染結果
    contentElem.innerHTML = html;

    // 顯示 HTML 原始碼
    codeContentElem.textContent = html;
  }

  function deltaToHtml(delta: any): string {
    const Quill = (window as any).Quill;
    const container = document.createElement("div");
    const tempQuill = new Quill(container);

    tempQuill.setContents(delta);

    return tempQuill.root.innerHTML;
  }
</script>

<section style="overflow-x: hidden;">
  <div>
    <h2>Quill Editor</h2>
    <button on:click={getContent} style="margin-bottom: 1rem">
      取得 HTML 內容
    </button>
  </div>

  <!-- 這裡就是原本的 #editor -->
  <div class="editor-block" bind:this={editorElem}>
    <p>Hello World!</p>
    <p>Some initial <strong>bold</strong> text</p>
    <p><br /></p>
  </div>

  <div style="padding: 1rem">
    <p>Show Content</p>
    <div class="show-block" style="max-width: 1120px; width:100%; box-sizing: border-box;">
      <div
        bind:this={codeContentElem}
        style="padding: 1rem 0; white-space: pre-wrap; font-family: monospace;"
      ></div>
      <div
        bind:this={contentElem}
        style="padding: 1rem 0; border: 1px solid #ccc"
      ></div>
    </div>
  </div>
</section>

<style scoped>
  .editor-block,
  .show-block {
    background-color: #fff;
    color: #222;
  }

  :global(section .ql-toolbar.ql-snow) {
    border-radius: 4px 4px 0 0;
    background-color: #fff;
  }
</style>
