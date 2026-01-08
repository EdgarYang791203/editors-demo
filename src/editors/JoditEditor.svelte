<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Jodit } from "jodit";
  import "jodit/es5/jodit.min.css";
  import "../assets/global-editor.css";

  type StyleKey =
    | "customD1"
    | "customD2"
    | "headingH1"
    | "headingH2"
    | "headingH3"
    | "headingH4"
    | "headingH5"
    | "headingH6"
    | "subheading1"
    | "subheading2"
    | "subheadingSecondary1"
    | "subheadingSecondary2"
    | "content1"
    | "content2"
    | "description";

  type StyleGroup =
    | "emphasis"
    | "heading"
    | "contentHeading"
    | "secondaryContentHeading"
    | "paragraphVariant";

  type BlockStyleDef = {
    key: StyleKey;
    title: string;
    tag: "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    className: string;
    group: StyleGroup;
  };

  const STYLE_DEFS: BlockStyleDef[] = [
    // Order matches TinyMCE style list
    {
      key: "customD1",
      title: "醒目 D1",
      tag: "div",
      className: "custom-d1",
      group: "emphasis",
    },
    {
      key: "customD2",
      title: "醒目 D2",
      tag: "div",
      className: "custom-d2",
      group: "emphasis",
    },

    {
      key: "headingH1",
      title: "標題 H1",
      tag: "h1",
      className: "heading-h1",
      group: "heading",
    },
    {
      key: "headingH2",
      title: "標題 H2",
      tag: "h2",
      className: "heading-h2",
      group: "heading",
    },
    {
      key: "headingH3",
      title: "標題 H3",
      tag: "h3",
      className: "heading-h3",
      group: "heading",
    },
    {
      key: "headingH4",
      title: "標題 H4",
      tag: "h4",
      className: "heading-h4",
      group: "heading",
    },
    {
      key: "headingH5",
      title: "標題 H5",
      tag: "h5",
      className: "heading-h5",
      group: "heading",
    },
    {
      key: "headingH6",
      title: "標題 H6",
      tag: "h6",
      className: "heading-h6",
      group: "heading",
    },

    {
      key: "subheading1",
      title: "內文標題1",
      tag: "h2",
      className: "subheading",
      group: "contentHeading",
    },
    {
      key: "subheadingSecondary1",
      title: "內文次要標題1",
      tag: "h3",
      className: "subheading-secondary",
      group: "secondaryContentHeading",
    },
    {
      key: "content1",
      title: "內文1",
      tag: "p",
      className: "content-1",
      group: "paragraphVariant",
    },
    {
      key: "subheading2",
      title: "內文標題2",
      tag: "h2",
      className: "subheading2",
      group: "contentHeading",
    },
    {
      key: "subheadingSecondary2",
      title: "內文次要標題2",
      tag: "h3",
      className: "subheading-secondary2",
      group: "secondaryContentHeading",
    },
    {
      key: "content2",
      title: "內文2",
      tag: "p",
      className: "content-2",
      group: "paragraphVariant",
    },
    {
      key: "description",
      title: "說明文字",
      tag: "p",
      className: "description",
      group: "paragraphVariant",
    },
  ];

  const STYLE_BY_KEY = new Map<StyleKey, BlockStyleDef>(
    STYLE_DEFS.map((d) => [d.key, d])
  );

  const CLASSNAMES_BY_GROUP: Record<StyleGroup, string[]> = STYLE_DEFS.reduce(
    (acc, d) => {
      acc[d.group].push(d.className);
      return acc;
    },
    {
      emphasis: [],
      heading: [],
      contentHeading: [],
      secondaryContentHeading: [],
      paragraphVariant: [],
    } as Record<StyleGroup, string[]>
  );

  const ALL_STYLE_CLASSNAMES = new Set(STYLE_DEFS.map((d) => d.className));

  function getClosestBlock(editor: any): HTMLElement | null {
    const current: Node | null =
      editor?.s?.current?.() ??
      editor?.selection?.current?.() ??
      editor?.selection?.focusNode ??
      editor?.s?.range?.startContainer ??
      null;

    const root: HTMLElement | null =
      editor?.container?.querySelector?.(".jodit-wysiwyg") ??
      editor?.editor ??
      null;

    if (!current || !root) return null;

    // Jodit Dom.closest can return null for text nodes (Node type 3).
    // Do a simple, reliable parent walk within the editor root.
    const selector = "p,h1,h2,h3,h4,h5,h6,div";

    const startEl: Element | null =
      current.nodeType === Node.ELEMENT_NODE
        ? (current as unknown as Element)
        : (current as any).parentElement ?? null;

    if (!startEl) return null;
    if (!root.contains(startEl)) return null;

    let el: Element | null = startEl;
    while (el && el !== root) {
      if (el.matches(selector)) return el as HTMLElement;
      el = el.parentElement;
    }

    return null;
  }

  function replaceTag(
    editor: any,
    el: HTMLElement,
    newTag: string
  ): HTMLElement {
    const tag = newTag.toLowerCase();
    if (el.tagName.toLowerCase() === tag) return el;

    const next = editor?.create?.element
      ? editor.create.element(tag)
      : (document.createElement(tag) as HTMLElement);

    // Keep content and non-style attributes (but drop tag-specific semantics).
    next.innerHTML = el.innerHTML;
    for (const { name, value } of Array.from(el.attributes)) {
      if (name === "class") continue;
      next.setAttribute(name, value);
    }

    el.parentNode?.replaceChild(next, el);
    return next;
  }

  function setExclusiveStyleClass(el: HTMLElement, className: string) {
    // Single dropdown => a single active style at a time.
    // Remove ALL known style classes (across all groups), but keep other classes.
    const kept = Array.from(el.classList).filter((c) => !ALL_STYLE_CLASSNAMES.has(c));
    kept.push(className);
    el.className = Array.from(new Set(kept)).join(" ");
  }

  function debugNodeSummary(node: any) {
    if (!node) return "<null>";
    try {
      if (node instanceof Element) {
        const cls = node.getAttribute("class") || "";
        return `<${node.tagName.toLowerCase()} class=\"${cls}\">`;
      }
      return `Node(type=${node.nodeType})`;
    } catch {
      return "<unprintable>";
    }
  }

  function applyBlockStyle(editor: any, key: StyleKey) {
    const def = STYLE_BY_KEY.get(key);
    if (!def) return;

    const dbg = Boolean(debugLogStyleApply);
    if (dbg) {
      console.groupCollapsed(
        `[JoditStyle] applyBlockStyle(${def.key}) -> <${def.tag} class=\"${def.className}\">`
      );
      try {
        console.log("before: editor.value", editor?.value);
        console.log(
          "before: selection.current",
          debugNodeSummary(editor?.s?.current?.() ?? editor?.selection?.current?.())
        );
      } catch {
        // ignore
      }
    }

    // Jodit toolbar dropdown steals focus; caller should restore selection first.
    // Still do a best-effort focus here.
    editor?.focus?.();

    // Prefer native editor commands for block/tag changes.
    // This is more reliable than manual DOM replace in contenteditable.
    try {
      editor?.execCommand?.("formatBlock", false, def.tag);
    } catch {
      // ignore and fallback below
    }

    if (dbg) {
      try {
        const root: HTMLElement | null =
          editor?.container?.querySelector?.(".jodit-wysiwyg") ??
          editor?.editor ??
          null;
        console.log("after formatBlock: selection.current", debugNodeSummary(editor?.s?.current?.() ?? editor?.selection?.current?.()));
        console.log(
          "after formatBlock: root.innerHTML",
          root ? root.innerHTML : "<no root>"
        );
      } catch {
        // ignore
      }
    }

    let block = getClosestBlock(editor);
    if (!block) {
      if (dbg) {
        console.warn("getClosestBlock() returned null; class will not be set.");
        console.groupEnd();
      }
      return;
    }

    if (dbg) {
      console.log(
        "closest block (pre-replace):",
        debugNodeSummary(block),
        "outerHTML:",
        (block as HTMLElement).outerHTML
      );
    }

    // If formatBlock didn't change tag (or not supported), fallback to manual replace.
    block = replaceTag(editor, block, def.tag);

    if (dbg) {
      console.log(
        "block after replaceTag:",
        debugNodeSummary(block),
        "outerHTML:",
        (block as HTMLElement).outerHTML
      );
    }

    setExclusiveStyleClass(block, def.className);

    if (dbg) {
      console.log(
        "block after setExclusiveStyleClass:",
        debugNodeSummary(block),
        "outerHTML:",
        (block as HTMLElement).outerHTML
      );
    }

    if (debugHoldSync) {
      if (dbg) {
        console.warn(
          "debugHoldSync=true: skipping synchronizeValues() and change event; bind:value will NOT update."
        );
        console.groupEnd();
      }
      return;
    }

    // Ensure changes propagate to textarea + bind:value.
    // Avoid setEditorValue here because it can re-run CleanHTML and strip attrs.
    editor?.synchronizeValues?.();

    if (dbg) {
      try {
        console.log("after synchronizeValues: editor.value", editor?.value);
      } catch {
        // ignore
      }
    }

    const nextHtml = typeof editor?.value === "string" ? editor.value : "";
    editor?.events?.fire?.("change", nextHtml);

    if (dbg) {
      console.groupEnd();
    }
  }

  function ensureStyleSelectControlRegistered() {
    const controls = (Jodit as any).defaultOptions?.controls;
    if (!controls) return;
    if (controls.styleSelect) return;

    const getChosenKey = (btnOrOptions: any): StyleKey | undefined => {
      const rawKey = (btnOrOptions?.control?.args?.[0] ??
        btnOrOptions?.args?.[0] ??
        btnOrOptions?.options?.control?.args?.[0]) as unknown;

      if (typeof rawKey !== "string") return undefined;
      if (!STYLE_BY_KEY.has(rawKey as StyleKey)) return undefined;
      return rawKey as StyleKey;
    };

    // Register a dropdown list button in the toolbar.
    controls.styleSelect = {
      name: "styleSelect",
      text: "選擇樣式",
      tooltip: "選擇樣式",
      list: Object.fromEntries(STYLE_DEFS.map((d) => [d.key, d.title])),
      exec: (editor: any, _current: any, btnOrOptions: any) => {
        const chosen = getChosenKey(btnOrOptions);
        if (!chosen) {
          // Dropdown opening: snapshot selection so the next click can apply to the
          // correct block (toolbar clicks usually clear selection).
          try {
            (editor as any).__styleSelectSavedSelection =
              editor?.selection?.save?.() ?? editor?.s?.save?.();
          } catch {
            (editor as any).__styleSelectSavedSelection = null;
          }
          return false; // open dropdown
        }
        applyBlockStyle(editor, chosen);
      },
      childExec: (editor: any, _current: any, btnOrOptions: any) => {
        const chosen = getChosenKey(btnOrOptions);
        if (!chosen) return;

        // Restore selection saved on dropdown open.
        const saved = (editor as any).__styleSelectSavedSelection;
        if (saved) {
          try {
            editor?.selection?.restore?.(saved);
          } catch {
            // ignore
          }
        }
        (editor as any).__styleSelectSavedSelection = null;

        applyBlockStyle(editor, chosen);
      },
      childTemplate: (_editor: any, styleKey: string, title: string) => {
        const def = STYLE_BY_KEY.get(styleKey as StyleKey);
        if (!def) return `<span>${title}</span>`;
        const tag = def.tag;
        const cls = def.className;
        // Use .editor-content wrapper so preview can reuse the same scoped CSS.
        return `<div class="editor-content"><${tag} class="${cls}">${title}</${tag}></div>`;
      },
    };
  }

  // 外部可以用 bind:value 傳進來 / 取得內容
  export let value: string = "";
  // 外部可傳入 Jodit 設定（toolbar、顏色限制等）
  export let config: any = {};
  // Debug helpers
  export let debugLogStyleApply: boolean = false;
  export let debugHoldSync: boolean = false;

  let textareaElem: HTMLTextAreaElement | null = null;
  let joditInstance: any = null;

  function ensureEditorContentClassApplied(instance: any) {
    try {
      const root: HTMLElement | null =
        instance?.container?.querySelector?.(".jodit-wysiwyg") ??
        instance?.editor ??
        null;

      root?.classList?.add("editor-content");
    } catch {
      // ignore
    }
  }

  // 初始化 Jodit
  onMount(() => {
    if (!textareaElem) return;

    ensureStyleSelectControlRegistered();

    joditInstance = new (Jodit as any)(textareaElem, {
      toolbarAdaptive: false,
      defaultMode: (Jodit as any).MODE_WYSIWYG,

      // ✅ 允許 class 屬性保留（不然你套上的 heading-h1/custom-d1 會被清掉）
      cleanHTML: {
        // 建議至少把 script 擋住（預設就會擋 script）
        denyTags: "script",

        // ✅ 需求：class/style 全放行，避免工具列（對齊/顏色等）在 editor 內立刻被清掉
        // allowTags=false 表示不啟用白名單（仍會套用基本安全處理，例如 denyTags=script）
        allowTags: false,
      },
      ...config,
    });

    // 設定初始內容
    joditInstance.value = value || "";

    // Ensure our scoped CSS (.editor-content ...) actually matches inside Jodit.
    ensureEditorContentClassApplied(joditInstance);

    // 監聽內容變化，回寫到 value（支援 bind:value）
    joditInstance.events.on("change", (newValue: string) => {
      if (debugHoldSync) return;
      value = newValue;
    });
  });

  // 如果外部修改了 value（例如重設內容），同步回 editor
  $: if (joditInstance && joditInstance.value !== value) {
    joditInstance.value = value ?? "";
  }

  onDestroy(() => {
    if (joditInstance) {
      joditInstance.destruct();
      joditInstance = null;
    }
  });
</script>

<textarea bind:this={textareaElem}></textarea>

<style>
  /* App-level :root sets text to white in dark mode; Jodit editor surface is white,
     so force readable defaults inside the editor. */
  :global(.jodit-container) {
    color: #0c0e1f;
  }

  :global(.jodit-container .jodit-wysiwyg) {
    color: #0c0e1f;
    background-color: #ffffff;
  }
</style>
