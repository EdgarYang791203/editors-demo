<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let editor: any = null;

  let presenceEl: HTMLDivElement | null = null;
  let menuBarEl: HTMLDivElement | null = null;
  let toolbarEl: HTMLDivElement | null = null;
  let editorHostEl: HTMLDivElement | null = null;

  let codeContentEl: HTMLDivElement | null = null;
  let contentEl: HTMLDivElement | null = null;

  onMount(async () => {
    const CKEDITOR = (window as any).CKEDITOR;

    if (!CKEDITOR) {
      console.error("window.CKEDITOR 沒有載到，請確認 CDN script 有引入");
      return;
    }

    const {
      DecoupledEditor,
      Essentials,
      Paragraph,
      Heading,
      Bold,
      Italic,
      List,
      ListProperties,
      Link,
      BlockQuote,
      Table,
      TableToolbar,
      ImageBlock,
      ImageCaption,
      ImageStyle,
      ImageToolbar,
      ImageUpload,
      Base64UploadAdapter,
      ImageResize,
    } = CKEDITOR;

    const allPlugins = [
      Essentials,
      Paragraph,
      Heading,
      Bold,
      Italic,
      Link,
      List,
      ListProperties,
      BlockQuote,
      Table,
      TableToolbar,
      ImageBlock,
      ImageCaption,
      ImageStyle,
      ImageToolbar,
      ImageUpload,
      Base64UploadAdapter,
      ImageResize,
    ];

    const plugins = allPlugins.filter(Boolean);

    if (!editorHostEl) return;

    // ✅ 這個要保留，因為你用的是 premium build
    const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY || "";

    const editorConfig: any = {
      toolbar: {
        items: [
          "undo",
          "redo",
          "|",
          "heading",
          "|",
          "bold",
          "italic",
          "link",
          "bulletedList",
          "numberedList",
          "|",
          "blockQuote",
          "insertTable",
          "uploadImage",
        ],
      },
      plugins: plugins,
      initialData: `<p>Hello from CKEditor 5!</p>`,
      licenseKey: LICENSE_KEY,
      image: {
        toolbar: [
          "toggleImageCaption",
          "imageStyle:alignBlockLeft",
          "imageStyle:block",
          "imageStyle:alignBlockRight",
        ],
        styles: {
          options: ["alignBlockLeft", "block", "alignBlockRight"],
        },
      },
    };

    editor = await DecoupledEditor.create(editorHostEl, editorConfig);

    if (toolbarEl) {
      toolbarEl.appendChild(editor.ui.view.toolbar.element);
    }
    if (menuBarEl && editor.ui.view.menuBarView) {
      menuBarEl.appendChild(editor.ui.view.menuBarView.element);
    }
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  });

  function getContent() {
    if (!editor) return;
    const html = editor.getData();
    if (codeContentEl) codeContentEl.textContent = html;
    if (contentEl) contentEl.innerHTML = html;
  }
</script>

<section>
  <h2>CKEditor 5</h2>
  <div class="main-container">
    <button on:click={getContent} style="margin-bottom: 1rem">
      取得 HTML 內容
    </button>

    <div class="presence" bind:this={presenceEl}></div>

    <div
      class="editor-container editor-container_document-editor editor-container_include-annotations"
    >
      <div class="editor-container__menu-bar" bind:this={menuBarEl}></div>
      <div class="editor-container__toolbar" bind:this={toolbarEl}></div>

      <div class="editor-container__editor-wrapper">
        <div class="editor-container__editor">
          <div bind:this={editorHostEl} style="max-width: 100%;"></div>
        </div>
      </div>
    </div>

    <div style="padding: 1rem; max-width: 883px; width:100%; box-sizing: border-box;">
      <p>Show Content</p>
      <div bind:this={codeContentEl} style="margin-bottom: 1rem;white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
      <div
        bind:this={contentEl}
        style="padding: 1rem; border: 1px solid #ccc; max-width: 100%;"
      ></div>
    </div>
  </div>
</section>
