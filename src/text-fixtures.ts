import loremText from "./lorem.txt?raw";

const DEFAULT_WORD_COUNT = 100000;

const BASE_WORDS = loremText.split(/\s+/).filter(Boolean);

const normalizeCount = (count: number): number =>
  Math.max(1, Math.floor(count));

export const getWords = async (
  count = DEFAULT_WORD_COUNT,
): Promise<string[]> => {
  const total = normalizeCount(count);
  const words = new Array<string>(total);

  for (let index = 0; index < total; index += 1) {
    words[index] = BASE_WORDS[index % BASE_WORDS.length];
  }

  return words;
};

const getRandomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
  Math.ceil(min);

export const wordsToSentences = (
  words: string[],
  minWords = 10,
  maxWords = 100,
): string[][] => {
  const min = Math.max(1, Math.floor(minWords));
  const max = Math.max(min, Math.floor(maxWords));
  const sentences: string[][] = [];

  for (let index = 0; index < words.length; ) {
    const remaining = words.length - index;
    const size = getRandomInt(min, max);
    const take = remaining >= min ? Math.min(size, remaining) : remaining;

    if (take <= 0) {
      break;
    }

    sentences.push(words.slice(index, index + take));
    index += take;
  }

  return sentences;
};

export type ConversationTurn = {
  me: string;
  you: string;
};

export const sentencesToConversation = (
  sentences: string[][],
): ConversationTurn[] => {
  const turns: ConversationTurn[] = [];

  for (let index = 0; index < sentences.length; index += 2) {
    const me = sentences[index] ?? [];
    const you = sentences[index + 1] ?? [];

    if (me.length === 0 && you.length === 0) {
      continue;
    }

    turns.push({
      me: me.join(" "),
      you: you.join(" "),
    });
  }

  return turns;
};
