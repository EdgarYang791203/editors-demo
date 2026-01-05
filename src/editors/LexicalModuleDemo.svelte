<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  import { registerDragonSupport } from "@lexical/dragon";
  import { createEmptyHistoryState, registerHistory } from "@lexical/history";
  import {
    HeadingNode,
    QuoteNode,
    registerRichText,
    $createHeadingNode,
    $setBlocksType
  } from "@lexical/rich-text";
  import { mergeRegister } from "@lexical/utils";
  import {
    createEditor,
    HISTORY_MERGE_TAG,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    UNDO_COMMAND,
    REDO_COMMAND,
    $getSelection,
    $isRangeSelection,
    $isNodeSelection,
    $createParagraphNode,
    COMMAND_PRIORITY_LOW
  } from "lexical"

	import "../assets/lexical-style.css";

  let editorRef: HTMLElement | null = null;
  let stateRef: HTMLTextAreaElement | null = null;

  function init() {
    document.querySelector<HTMLDivElement>("#lexical-playground")!.innerHTML = `
    <div>
        <h1>Lexical Basic - Vanilla JS</h1>
        <div class="editor-wrapper">
        <div id="lexical-editor" contenteditable></div>
        </div>
        <h4>Editor state:</h4>
        <textarea id="lexical-state"></textarea>
    </div>
    `;
    editorRef = document.getElementById("lexical-editor");
    stateRef = document.getElementById("lexical-state") as HTMLTextAreaElement;
  }

  let editor: ReturnType<typeof createEditor> | null = null;

  onMount(() => {
    init();

    // 確保 DOM 已經 mount 完成再初始化 editor
    const initialConfig = {
      namespace: "Vanilla JS Demo",
      nodes: [HeadingNode, QuoteNode],
      onError: (error: Error) => {
        throw error;
      },
      theme: {
        quote: "PlaygroundEditorTheme__quote",
      },
    };
    editor = createEditor(initialConfig);
    editor.setRootElement(editorRef);

    // Registering Plugins
    mergeRegister(
      registerRichText(editor),
      registerDragonSupport(editor),
      registerHistory(editor, createEmptyHistoryState(), 300)
    );

    editor.update(prepopulatedRichText, { tag: HISTORY_MERGE_TAG });

    editor.registerUpdateListener(({ editorState }) => {
      if (stateRef) {
        stateRef.value = JSON.stringify(editorState.toJSON(), undefined, 2);
      }
    });
  });
</script>

<section>
  <div id="lexical-playground"></div>
</section>
