import { createWithEqualityFn } from "zustand/traditional";
import { immer } from "zustand/middleware/immer";
import {
  type ConversationTurn,
  getWords,
  sentencesToConversation,
  wordsToSentences,
} from "@/text-fixtures";

type ConversationState = {
  conversation: ConversationTurn[];

  create: (conversation: ConversationTurn[]) => void;
  add: (turn: ConversationTurn) => void;
  remove: (index: number) => void;
  update: (index: number, update: Partial<ConversationTurn>) => void;
  clear: () => void;
  load: () => Promise<void>;
};

export const useConversationStore = createWithEqualityFn<ConversationState>()(
  immer((set) => ({
    conversation: [],

    create: (conversation) => {
      set((state) => {
        state.conversation = conversation;
      });
    },

    add: (turn) => {
      set((state) => {
        state.conversation.push(turn);
      });
    },

    remove: (index) => {
      set((state) => {
        if (index < 0 || index >= state.conversation.length) {
          return;
        }

        state.conversation.splice(index, 1);
      });
    },

    update: (index, update) => {
      set((state) => {
        if (index < 0 || index >= state.conversation.length) {
          return;
        }

        state.conversation[index] = {
          ...state.conversation[index],
          ...update,
        };
      });
    },

    clear: () => {
      set((state) => {
        state.conversation = [];
      });
    },

    load: async () => {
      const words = await getWords();

      const data = sentencesToConversation(wordsToSentences(words));

      set((state) => {
        state.conversation = data;
      });
    },
  })),
);
