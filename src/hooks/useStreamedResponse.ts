import { useConversationStore } from "@/store";
import { getWords } from "@/text-fixtures";
import { useCallback, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

interface StreamController {
  interval: number | null;
  raf: number | null;
  done: boolean;
  buffer: string;
  pending: string[];
}

type StreamOptions = {
  wordCount?: number;
};

export const useStreamedResponse = (options: StreamOptions = {}) => {
  const { wordCount = 10000 } = options;
  const streamIdRef = useRef(0);
  const streamControllerRef = useRef<StreamController | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const { update } = useConversationStore(
    useShallow((state) => ({
      update: state.update,
    })),
  );

  const cleanup = () => {
    const controller = streamControllerRef.current;
    if (!controller) return;

    const interval = controller.interval;
    if (interval !== null) {
      clearInterval(interval);
    }

    const raf = controller.raf;
    if (raf !== null) {
      cancelAnimationFrame(raf);
    }

    streamControllerRef.current = null;
  };

  const stop = useCallback(() => {
    streamIdRef.current += 1;

    cleanup();

    setIsGenerating(false);
  }, []);

  const stream = useCallback(
    async (turn: number) => {
      stop();

      const streamId = streamIdRef.current;
      setIsGenerating(true);
      const words = await getWords(wordCount);

      if (streamIdRef.current !== streamId) {
        return;
      }

      const responseWords =
        words.length > wordCount ? words.slice(0, wordCount) : words;
      const chunkSize = 25;
      const delayMs = 15;
      let offset = 0;

      const controller: StreamController = {
        interval: null,
        raf: null,
        done: false,
        buffer: "",
        pending: [] as string[],
      };

      streamControllerRef.current = controller;

      const flush = () => {
        controller.raf = null;
        if (streamIdRef.current !== streamId) {
          return;
        }

        if (controller.pending.length > 0) {
          const chunk = controller.pending.join(" ");
          controller.pending = [];
          controller.buffer = controller.buffer
            ? `${controller.buffer} ${chunk}`
            : chunk;
          update(turn, { you: controller.buffer });
        }

        if (controller.done && controller.pending.length === 0) {
          streamControllerRef.current = null;
          setIsGenerating(false);
        }
      };

      const schedule = () => {
        if (controller.raf === null) {
          controller.raf = requestAnimationFrame(flush);
        }
      };

      controller.interval = setInterval(() => {
        if (streamIdRef.current !== streamId) {
          return;
        }

        const next = responseWords.slice(offset, offset + chunkSize);
        if (next.length === 0) {
          controller.done = true;
          if (controller.interval !== null) {
            clearInterval(controller.interval);
            controller.interval = null;
          }
          schedule();
          return;
        }

        controller.pending.push(next.join(" "));
        offset += chunkSize;
        schedule();
      }, delayMs);
    },
    [stop, update, wordCount],
  );

  return { isGenerating, stop, stream };
};
