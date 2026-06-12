// Core domain types for Cakap.

export type LanguageCode = "ms" | "zh" | "ko" | "en";

export type Level = "beginner" | "intermediate" | "advanced";

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface VocabSuggestion {
  word: string;
  meaning: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** English translation of an assistant message (revealed on tap). */
  translation?: string | null;
  /** Romanization (pinyin / romaja) for languages that use a non-Latin script. */
  romanization?: string | null;
  /** Corrections for a user message, returned with the following assistant turn. */
  corrections?: Correction[];
  /** New words the AI suggests saving, attached to an assistant message. */
  vocabSuggestions?: VocabSuggestion[];
}

/** Structured payload returned by the AI for a single assistant turn. */
export interface AssistantReply {
  reply: string;
  reply_translation: string | null;
  reply_romanization: string | null;
  corrections: Correction[];
  vocab_suggestions: VocabSuggestion[];
}

/** Minimal message shape sent to the chat API. */
export interface ProviderMessageLike {
  role: "user" | "assistant";
  content: string;
}

export interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  language: LanguageCode;
  createdAt: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  /** Who the AI plays. */
  character: string;
  /** The situation the user is dropped into. */
  situation: string;
  emoji: string;
}

export interface Conversation {
  id: string;
  title: string;
  languageCode: LanguageCode;
  scenarioId: string | null;
  level: Level;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ThemePreference = "light" | "dark" | "system";

export interface Settings {
  theme: ThemePreference;
  activeLanguage: LanguageCode;
  level: Level;
  voiceEnabled: boolean;
  showRomanization: boolean;
}
