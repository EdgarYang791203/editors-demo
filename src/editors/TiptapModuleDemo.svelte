<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  import { Color } from "@tiptap/extension-text-style";
  import { ListItem } from "@tiptap/extension-list";
  import { TextStyle } from "@tiptap/extension-text-style";
  import StarterKit from "@tiptap/starter-kit";
  import { Editor } from "@tiptap/core";

  let element: HTMLElement | null = null;
  let editor: Editor | null = null;

  let codeContentEl: HTMLDivElement | null = null;
  let contentEl: HTMLDivElement | null = null;

  onMount(() => {
    editor = new Editor({
      element: element,
      extensions: [
        Color.configure({ types: [TextStyle.name, ListItem.name] }),
        TextStyle,
        StarterKit,
      ],
      content: `<h2>
          Hi there,
        </h2>
        <p>
          this is a <em>basic</em> example of <strong>Tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
        </p>
        <ul>
          <li>
            That’s a bullet list with one …
          </li>
          <li>
            … or two list items.
          </li>
        </ul>
        <p>
          Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
        </p>
        <pre><code class="language-css">body {
  display: none;
}</code></pre>`,
      onTransaction: () => {
        editor = editor;
      },
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  });

  function getHtml() {
    if (!editor) return;
    const html = editor.getHTML();

    if (codeContentEl) {
      codeContentEl.textContent = html;
    }
    if (contentEl) {
      contentEl.innerHTML = html;
    }
  }
</script>

<section>
  {#if editor}
    <div class="control-group">
      <h2 class="title">Tiptap</h2>

      <button style="margin-bottom: 1rem" on:click={getHtml}>
        取得 HTML 內容
      </button>

      <div class="button-group" style="margin-bottom: 1rem">
        <button
          on:click={() => editor && editor.chain().focus().toggleBold().run()}
          disabled={!editor || !editor.can().chain().focus().toggleBold().run()}
          class={editor && editor.isActive("bold") ? "is-active" : ""}
        >
          Bold
        </button>

        <button
          on:click={() => editor && editor.chain().focus().toggleItalic().run()}
          disabled={!editor ||
            !editor.can().chain().focus().toggleItalic().run()}
          class={editor && editor.isActive("italic") ? "is-active" : ""}
        >
          Italic
        </button>

        <button
          on:click={() => editor && editor.chain().focus().toggleStrike().run()}
          disabled={!editor ||
            !editor.can().chain().focus().toggleStrike().run()}
          class={editor && editor.isActive("strike") ? "is-active" : ""}
        >
          Strike
        </button>

        <button
          on:click={() => editor && editor.chain().focus().toggleCode().run()}
          disabled={!editor || !editor.can().chain().focus().toggleCode().run()}
          class={editor && editor.isActive("code") ? "is-active" : ""}
        >
          Code
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().unsetAllMarks().run()}
        >
          Clear marks
        </button>

        <button
          on:click={() => editor && editor.chain().focus().clearNodes().run()}
        >
          Clear nodes
        </button>

        <button
          on:click={() => editor && editor.chain().focus().setParagraph().run()}
          class={editor && editor.isActive("paragraph") ? "is-active" : ""}
        >
          Paragraph
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleHeading({ level: 1 }).run()}
          class={editor && editor.isActive("heading", { level: 1 })
            ? "is-active"
            : ""}
        >
          H1
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleHeading({ level: 2 }).run()}
          class={editor && editor.isActive("heading", { level: 2 })
            ? "is-active"
            : ""}
        >
          H2
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleHeading({ level: 3 }).run()}
          class={editor && editor.isActive("heading", { level: 3 })
            ? "is-active"
            : ""}
        >
          H3
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleHeading({ level: 4 }).run()}
          class={editor && editor.isActive("heading", { level: 4 })
            ? "is-active"
            : ""}
        >
          H4
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleHeading({ level: 5 }).run()}
          class={editor && editor.isActive("heading", { level: 5 })
            ? "is-active"
            : ""}
        >
          H5
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleHeading({ level: 6 }).run()}
          class={editor && editor.isActive("heading", { level: 6 })
            ? "is-active"
            : ""}
        >
          H6
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleBulletList().run()}
          class={editor && editor.isActive("bulletList") ? "is-active" : ""}
        >
          Bullet list
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleOrderedList().run()}
          class={editor && editor.isActive("orderedList") ? "is-active" : ""}
        >
          Ordered list
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleCodeBlock().run()}
          class={editor && editor.isActive("codeBlock") ? "is-active" : ""}
        >
          Code block
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().toggleBlockquote().run()}
          class={editor && editor.isActive("blockquote") ? "is-active" : ""}
        >
          Blockquote
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().setHorizontalRule().run()}
        >
          Horizontal rule
        </button>

        <button
          on:click={() => editor && editor.chain().focus().setHardBreak().run()}
        >
          Hard break
        </button>

        <button
          on:click={() => editor && editor.chain().focus().undo().run()}
          disabled={!editor || !editor.can().chain().focus().undo().run()}
        >
          Undo
        </button>

        <button
          on:click={() => editor && editor.chain().focus().redo().run()}
          disabled={!editor || !editor.can().chain().focus().redo().run()}
        >
          Redo
        </button>

        <button
          on:click={() =>
            editor && editor.chain().focus().setColor("#958DF1").run()}
          class={editor && editor.isActive("textStyle", { color: "#958DF1" })
            ? "is-active"
            : ""}
        >
          Purple
        </button>
      </div>
    </div>
  {/if}

  <!-- editor 容器 -->
  <div bind:this={element} style="background-color: #fff; color: #222;"></div>

  <div style="padding: 1rem">
    <p>Show Content</p>

    <div
      bind:this={codeContentEl}
      style="margin-bottom: 1rem; white-space: pre-wrap; font-family: monospace;"
    ></div>

    <div
      bind:this={contentEl}
      style="padding: 1rem; border: 1px solid #ccc"
    ></div>
  </div>
</section>
