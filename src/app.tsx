import { IconPlayerStop, IconArrowUp } from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import {
  lazy,
  useState,
  useLayoutEffect,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  Suspense,
} from "react";
import { useShallow } from "zustand/shallow";
import { ChatInput } from "./components/ChatInput";
import { useStreamedResponse } from "./hooks/useStreamedResponse";
import { useConversationStore } from "./store";
import { Button } from "./components/ui/button";
import { Kbd } from "./components/ui/kbd";

const Conversation = lazy(() => import("./components/Conversation"));

function useChatAutoscroll(
  scrollerRef: React.RefObject<HTMLDivElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>,
) {
  const [pinned, setPinned] = useState(true);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;

    const computePinned = () => {
      const dist =
        scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
      setPinned(dist < 128);
    };

    const scrollToBottom = () => {
      scroller.scrollTop = scroller.scrollHeight;
    };

    const onScroll = () => computePinned();
    scroller.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      if (!pinned) return;
      scrollToBottom();
    });

    ro.observe(content);

    computePinned();
    if (pinned) scrollToBottom();

    return () => {
      ro.disconnect();
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [scrollerRef, contentRef, pinned]);
  return [pinned, setPinned] as const;
}

export const App = () => {
  const editorRef = useRef<Editor | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { conversation, load, add } = useConversationStore(
    useShallow((state) => ({
      conversation: state.conversation,
      load: state.load,
      add: state.add,
    })),
  );

  const { isGenerating, stop, stream } = useStreamedResponse();

  useEffect(() => void load(), [load]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stop]);

  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  const [pinned, setPinned] = useChatAutoscroll(scrollerRef, contentRef);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;

      const me = editor.getMarkdown();
      if (!me) return;

      editor.commands.clearContent();

      const turn = conversation.length;
      add({ me, you: "" });
      stream(turn);
    },
    [add, conversation.length, stream],
  );

  return (
    <main className="h-svh bg-muted/10">
      <div className="mx-auto h-full pb-8 flex flex-col">
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto overscroll-contain rounded-md"
        >
          <div
            ref={contentRef}
            className="flex max-w-2xl mx-auto flex-col gap-8 py-4"
          >
            <Suspense>
              <Conversation />
            </Suspense>
          </div>
        </div>

        <div className="relative">
          {pinned ? null : (
            <Button
              className="absolute left-1/2 top-0 -translate-x-1/2 -m-4 -translate-y-full"
              onClick={() => {
                setPinned(true);
              }}
            >
              Scroll to bottom
            </Button>
          )}
          <form
            className="overflow-hidden shadow max-w-2xl mx-auto z-40 border border-border shadow-background/50 bg-background rounded-md flex flex-col w-full focus-within:ring focus-within:ring-ring transition-shadow"
            onSubmit={handleSubmit}
          >
            <div className="text-[0.625rem] p-2">
              <Kbd>⌘ + ⌥ + c</Kbd> Code,{" "}
              <span className="text-[0.625rem]">**Bold**</span>
            </div>
            <ChatInput onEditorReady={handleEditorReady} />
            <div className="h-10 z-10 px-2 items-center flex w-full bg-input border-t border-border">
              {isGenerating ? (
                <Button
                  type="button"
                  className="ml-auto"
                  variant="destructive"
                  size="lg"
                  onClick={stop}
                >
                  <IconPlayerStop />
                  Stop Generating
                </Button>
              ) : (
                <Button type="submit" className="ml-auto" size="icon-lg">
                  <IconArrowUp />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};
