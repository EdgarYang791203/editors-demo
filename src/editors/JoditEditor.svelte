<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Jodit } from "jodit";
  import "jodit/es5/jodit.min.css";

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
        : ((current as any).parentElement ?? null);

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
    const kept = Array.from(el.classList).filter(
      (c) => !ALL_STYLE_CLASSNAMES.has(c)
    );
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

    let block = getClosestBlock(editor);
    if (!block) return;

    // If formatBlock didn't change tag (or not supported), fallback to manual replace.
    block = replaceTag(editor, block, def.tag);

    setExclusiveStyleClass(block, def.className);

    // Ensure changes propagate to textarea + bind:value.
    // Avoid setEditorValue here because it can re-run CleanHTML and strip attrs.
    editor?.synchronizeValues?.();

    const nextHtml = typeof editor?.value === "string" ? editor.value : "";
    editor?.events?.fire?.("change", nextHtml);
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

    // 在工具列中註冊一個下拉清單按鈕。
    controls.styleSelect = {
      name: "styleSelect",
      text: "選擇樣式",
      tooltip: "選擇樣式",
      update: (editor: any, button: any) => {
        try {
          const block = getClosestBlock(editor);
          let label = "選擇樣式";

          if (block) {
            const matched = STYLE_DEFS.find((d) =>
              block.classList.contains(d.className)
            );
            if (matched) label = matched.title;
          }

          if (button?.state?.text !== label) {
            button.state.text = label;
          }
        } catch {
          // ignore
        }
      },
      list: Object.fromEntries(STYLE_DEFS.map((d) => [d.key, d.title])),
      exec: (editor: any, _current: any, btnOrOptions: any) => {
        const chosen = getChosenKey(btnOrOptions);
        if (!chosen) {
          // 下拉式選單開啟：快照選擇，以便下次點擊可以套用於
          // 工具列點擊通常會清除選擇。
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

        // 還原在下拉式選單開啟時儲存的選擇。
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
        // 使用 .editor-content scoped，以便預覽可以重複使用相同的作用域 CSS。
        return `<div class="editor-content"><${tag} class="${cls}">${title}</${tag}></div>`;
      },
    };
  }

  function stripBackgroundTabFromBrushPopup(popupRoot: unknown, editor: any) {
    try {
      const root = popupRoot as HTMLElement | null;
      if (!root || typeof (root as any).querySelector !== "function") return;

      const buttons = root.querySelector(
        ".jodit-tabs__buttons"
      ) as HTMLElement | null;
      const wrapper = root.querySelector(
        ".jodit-tabs__wrapper"
      ) as HTMLElement | null;

      if (!buttons || !wrapper) return;

      const bgLabel =
        (typeof editor?.i18n === "function" ? editor.i18n("Background") : "") ||
        "Background";
      const candidates = new Set([
        "Background",
        bgLabel,
        "背景",
        "底色",
        "背景色",
        "背景顏色",
      ]);

      const buttonEls = Array.from(buttons.children) as HTMLElement[];
      const tabEls = Array.from(wrapper.children) as HTMLElement[];

      const bgIndex = buttonEls.findIndex((el) => {
        const txt = (el.textContent ?? "").trim();
        if (!txt) return false;
        for (const c of candidates) {
          if (c && txt.includes(c)) return true;
        }
        return false;
      });

      if (bgIndex < 0) return;

      buttonEls[bgIndex]?.remove();
      tabEls[bgIndex]?.remove();

      // Make the remaining tab/button fill the width.
      const remainingBtn = buttons.firstElementChild as HTMLElement | null;
      if (remainingBtn) remainingBtn.style.width = "100%";

      // Ensure a tab is active.
      const remainingTab = wrapper.firstElementChild as HTMLElement | null;
      if (remainingTab) {
        for (const t of Array.from(wrapper.children)) {
          (t as HTMLElement).classList.remove("jodit-tab_active");
        }
        remainingTab.classList.add("jodit-tab_active");
      }
    } catch {
      // ignore
    }
  }

  function makeTextOnlyBrushControl(baseBrush: any) {
    return {
      ...(baseBrush ?? {}),
      popup: (editor: any, current: any, close: () => void, button: any) => {
        const modules =
          editor?.constructor?.modules ?? (Jodit as any)?.modules ?? null;
        const ColorPickerWidget = modules?.ColorPickerWidget;
        const TabsWidget = modules?.TabsWidget;
        const Dom = modules?.Dom;

        // If we can't access the widget modules, fallback to base popup,
        // then strip the Background tab from the DOM.
        if (!ColorPickerWidget) {
          const popupRoot =
            baseBrush?.popup?.(editor, current, close, button) ?? false;
          stripBackgroundTabFromBrushPopup(popupRoot, editor);
          return popupRoot;
        }

        let currentElement: HTMLElement | null = null;
        let currentColor = "";

        try {
          if (current && current !== editor.editor && Dom?.isNode?.(current)) {
            if (
              Dom?.isElement?.(current) &&
              editor?.s?.isCollapsed?.() &&
              !Dom?.isTag?.(current, new Set(["br", "hr"]))
            ) {
              currentElement = current as HTMLElement;
            }

            Dom?.up?.(
              current,
              (node: any) => {
                if (Dom?.isHTMLElement?.(node)) {
                  const cssColor = window.getComputedStyle(node).color;
                  if (cssColor) {
                    currentColor = cssColor;
                    return true;
                  }
                }
                return false;
              },
              editor.editor
            );
          }
        } catch {
          // ignore
        }

        const initial =
          (button as any)?.__textColor ??
          (typeof currentColor === "string" ? currentColor : "");

        const picker = ColorPickerWidget(
          editor,
          (value: string) => {
            try {
              if (!currentElement) {
                editor.execCommand?.("forecolor", false, value);
              } else {
                currentElement.style.color = value;
              }

              // Persist last chosen text color for the main button action.
              (button as any).__textColor = value;
              if (button?.state?.icon) button.state.icon.fill = value;
            } finally {
              close();
            }
          },
          initial
        );

        const tabName =
          (typeof editor?.i18n === "function" ? editor.i18n("Text") : "") ||
          "Text";

        // Use the same tab UI as Jodit, but only expose the Text tab.
        if (TabsWidget) {
          return TabsWidget(editor, [{ name: tabName, content: picker }], null);
        }

        return picker;
      },
      exec: (editor: any, current: any, { button }: any) => {
        const color = (button as any)?.__textColor;
        if (!color) return false;

        if (
          current &&
          current !== editor.editor &&
          current.nodeType === Node.ELEMENT_NODE
        ) {
          (current as HTMLElement).style.color = color;
          return;
        }

        editor.execCommand?.("forecolor", false, color);
      },
    };
  }

  function ensureTextOnlyBrushControlRegistered() {
    const controls = (Jodit as any).defaultOptions?.controls;
    if (!controls) return;

    const baseBrush = controls.brush;
    if (!baseBrush) return;

    // Prevent double-patching.
    if ((baseBrush as any).__textOnlyPatched) return;

    const patched = makeTextOnlyBrushControl(baseBrush);
    (patched as any).__textOnlyPatched = true;
    controls.brush = patched;
  }

  // 外部可以用 bind:value 傳進來 / 取得內容
  export let value: string = "";
  // 外部可傳入 Jodit 設定（toolbar、顏色限制等）
  export let config: any = {};

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

    // Make sure the brush control is text-color-only at the source.
    // This avoids cases where toolbar resolves controls from defaultOptions.
    ensureTextOnlyBrushControlRegistered();

    const baseControls = (Jodit as any).defaultOptions?.controls ?? {};
    const baseBrush = baseControls?.brush;
    const textOnlyBrushControl = makeTextOnlyBrushControl(baseBrush);

    const mergedControls = {
      ...(config?.controls ?? {}),
      brush: textOnlyBrushControl,
    };

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
      controls: mergedControls,
    });

    // Extra safety: block background color commands from any other entry.
    try {
      joditInstance?.events?.on?.("beforeCommand", (command: string) => {
        const cmd = String(command || "").toLowerCase();
        if (cmd === "background" || cmd === "backcolor") {
          return false;
        }
        return;
      });
    } catch {
      // ignore
    }

    // 設定初始內容
    joditInstance.value = value || "";

    // Ensure our scoped CSS (.editor-content ...) actually matches inside Jodit.
    ensureEditorContentClassApplied(joditInstance);

    const syncValueFromEditor = (reason: string) => {
      try {
        joditInstance?.synchronizeValues?.();
      } catch {
        // ignore
      }
      console.log(
        `JoditEditor: syncValueFromEditor updating value`,
        joditInstance.value
      );
      const nextHtml =
        typeof joditInstance?.value === "string" ? joditInstance.value : "";
      // Assigning the same value is a no-op for our `$:` sync guard.
      value = nextHtml;
    };

    // Log text-align actions from the toolbar (left/center/right).
    // Jodit justify plugin uses: justifyleft/justifycenter/justifyright/justifyfull
    const ALIGN_COMMANDS = new Set([
      "justifyleft",
      "justifycenter",
      "justifyright",
      "justifyfull",
      // Fallbacks if any custom button names leak through
      "left",
      "center",
      "right",
    ]);

    // Toolbar clicks can steal focus and clear selection. Keep a recent selection snapshot
    // so we can re-apply block-level operations reliably.
    let lastSelectionSnapshot: any = null;
    const saveSelectionSnapshot = () => {
      try {
        lastSelectionSnapshot =
          joditInstance?.selection?.save?.() ?? joditInstance?.s?.save?.();
      } catch {
        // ignore
      }
    };

    try {
      // Track selection changes while editing.
      joditInstance.events.on(
        joditInstance.editor,
        "mouseup keyup",
        saveSelectionSnapshot
      );
    } catch {
      // ignore
    }

    const restoreSelectionSnapshot = () => {
      if (!lastSelectionSnapshot) return;
      try {
        joditInstance?.selection?.restore?.(lastSelectionSnapshot);
      } catch {
        // ignore
      }
    };

    const applyTextAlignToClosestBlock = (
      align: "left" | "center" | "right" | "justify"
    ) => {
      // Best-effort: restore selection, focus editor, then find a block and apply style.
      restoreSelectionSnapshot();
      try {
        joditInstance?.s?.focus?.();
      } catch {
        // ignore
      }

      let block = getClosestBlock(joditInstance);
      if (!block) {
        // Ensure we have a block to apply alignment to.
        try {
          joditInstance?.execCommand?.("formatBlock", false, "p");
        } catch {
          // ignore
        }
        block = getClosestBlock(joditInstance);
      }

      if (block) {
        block.style.textAlign = align;
      }

      // 持久化到 editor.value + bind:value。
      syncValueFromEditor(`applyTextAlign:${align}`);

      const nextHtml =
        typeof joditInstance?.value === "string" ? joditInstance.value : "";
      joditInstance?.events?.fire?.("change", nextHtml);

      return false;
    };

    // Ensure the three toolbar buttons work even if the underlying browser command
    // (document.execCommand) is a no-op.
    const registerAlignCommand = (name: string, align: any) => {
      try {
        joditInstance?.registerCommand?.(name, () =>
          applyTextAlignToClosestBlock(align)
        );
      } catch {
        // ignore
      }
    };

    registerAlignCommand("left", "left");
    registerAlignCommand("center", "center");
    registerAlignCommand("right", "right");
    registerAlignCommand("justify", "justify");
    // Common variants used by built-in controls
    registerAlignCommand("justifyLeft", "left");
    registerAlignCommand("justifyCenter", "center");
    registerAlignCommand("justifyRight", "right");
    registerAlignCommand("justifyFull", "justify");

    joditInstance.events.on(
      "beforeCommand",
      (
        command: unknown,
        showUI?: unknown,
        value?: unknown,
        ...args: unknown[]
      ) => {
        if (typeof command !== "string") return;

        const cmd = command.toLowerCase();
        const isAlign = ALIGN_COMMANDS.has(cmd) || cmd.startsWith("justify");
        if (!isAlign) return;

        // 也請在此處進行快照（工具列點擊時間因瀏覽器/版本而異）。
        saveSelectionSnapshot();

        // 在某些建置/按鈕中，觸發的事件名稱是控制項名稱
        // （例如 `center`），因此 `afterCommand` 可能無法可靠地觸發。
        // 在下一個 tick 時同步，以防止 Svelte 使用過時的 `value` 覆蓋編輯器。
        setTimeout(() => {
          syncValueFromEditor(`postTick:${cmd}`);
        }, 0);
      }
    );

    // 監聽內容變化，回寫到 value（支援 bind:value）
    joditInstance.events.on("change", (newValue: string) => {
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

  :global(.jodit-color-picker__groups) {
    display: flex;
  }
  :global(.jodit-color-picker__color-item_active_true) {
    border-color: #f5f5f6;
  }
</style>
