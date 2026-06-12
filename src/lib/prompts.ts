import { getLanguage } from "./languages";
import type { LanguageCode, Level, Scenario, VocabWord } from "./types";

const LEVEL_GUIDANCE: Record<Level, string> = {
  beginner:
    "The learner is a BEGINNER. Use very short, simple sentences and common everyday words. Speak slowly in spirit. Keep your replies to 1-2 short sentences.",
  intermediate:
    "The learner is INTERMEDIATE. Use natural everyday language with moderate vocabulary. Keep replies to 2-3 sentences.",
  advanced:
    "The learner is ADVANCED. Speak naturally, including idioms and richer vocabulary, as you would with a native speaker.",
};

export interface PromptContext {
  languageCode: LanguageCode;
  level: Level;
  scenario: Scenario | null;
  vocab: VocabWord[];
}

/**
 * Builds the system instruction that turns the model into a patient
 * conversation partner. Pure function — easy to unit test.
 */
export function buildSystemPrompt(ctx: PromptContext): string {
  const lang = getLanguage(ctx.languageCode);
  const vocabWords = ctx.vocab.map((v) => v.word).slice(0, 30);

  const parts: string[] = [];

  parts.push(
    `You are a friendly, encouraging language tutor and roleplay partner helping someone practice conversational ${lang.name} (${lang.nativeName}).`,
  );
  parts.push(LEVEL_GUIDANCE[ctx.level]);

  if (ctx.scenario) {
    parts.push(
      `ROLEPLAY: You are playing "${ctx.scenario.character}". Scenario: ${ctx.scenario.situation} Stay in character, drive the conversation forward, and ask the learner questions so they keep talking.`,
    );
  } else {
    parts.push(
      `This is an open conversation. Chat naturally about any topic, and gently keep the conversation going by asking the learner questions.`,
    );
  }

  if (vocabWords.length > 0) {
    parts.push(
      `The learner is trying to remember these words — naturally weave some of them into the conversation when it makes sense: ${vocabWords.join(", ")}.`,
    );
  }

  parts.push(
    [
      "RULES:",
      `- Your "reply" field must be written ONLY in ${lang.name}.`,
      "- Be warm, patient and encouraging. Never lecture.",
      "- If the learner makes mistakes in their last message, list them in `corrections` (keep explanations short and in English). If there are no mistakes, return an empty array.",
      "- Suggest 0-3 useful new words from your reply in `vocab_suggestions` (word in the target language, meaning in English).",
      lang.hasRomanization
        ? `- Provide "reply_romanization" (${lang.romanizationLabel}) for your reply.`
        : `- Set "reply_romanization" to null.`,
      `- Always provide "reply_translation": a natural English translation of your reply.`,
    ].join("\n"),
  );

  return parts.join("\n\n");
}

/** JSON schema describing the structured reply we want back from the model. */
export const REPLY_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    reply_translation: { type: "string" },
    reply_romanization: { type: "string", nullable: true },
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["original", "corrected", "explanation"],
      },
    },
    vocab_suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          meaning: { type: "string" },
        },
        required: ["word", "meaning"],
      },
    },
  },
  required: ["reply", "reply_translation", "corrections", "vocab_suggestions"],
} as const;
