import "@/input.css";

import Highlight from "@tiptap/extension-highlight";
import { Markdown } from "@tiptap/markdown";
import Typography from "@tiptap/extension-typography";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import { useEffect, useLayoutEffect, useRef, type FC } from "react";

const lowlight = createLowlight(all);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("ts", ts);

const EPS = 2;

type ChatInputProps = {
  onEditorReady?: (editor: Editor) => void;
};

export const ChatInput: FC<ChatInputProps> = ({ onEditorReady }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastScrollHeightRef = useRef<number>(0);

  const editor = useEditor({
    extensions: [
      Markdown,
      StarterKit.configure({ codeBlock: false }),
      Highlight,
      Typography,
      Placeholder.configure({ placeholder: "Write something..." }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          const target = event.target as HTMLElement | null;
          const form = target?.closest("form");
          if (form instanceof HTMLFormElement) {
            form.requestSubmit();
          }
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const contentEl = scrollEl.querySelector<HTMLElement>(".ProseMirror");
    if (!contentEl) return;

    lastScrollHeightRef.current = scrollEl.scrollHeight;

    const ro = new ResizeObserver(() => {
      const prevScrollHeight = lastScrollHeightRef.current;
      const nextScrollHeight = scrollEl.scrollHeight;

      if (nextScrollHeight === prevScrollHeight) return;

      const clientHeight = scrollEl.clientHeight;
      const scrollTop = scrollEl.scrollTop;

      const wasAtBottom =
        Math.abs(prevScrollHeight - clientHeight - scrollTop) <= EPS;

      const delta = nextScrollHeight - prevScrollHeight;

      if (wasAtBottom) {
        scrollEl.scrollTop = nextScrollHeight;
      } else {
        scrollEl.scrollTop = scrollTop + delta;
      }

      lastScrollHeightRef.current = nextScrollHeight;
    });

    ro.observe(contentEl);

    return () => ro.disconnect();
  }, [editor]);

  return (
    <EditorContent
      ref={scrollRef}
      className="h-36 overflow-auto z-40 bg-muted/30 bottom-0 mt-auto text-sm w-full"
      editor={editor}
    />
  );
};
