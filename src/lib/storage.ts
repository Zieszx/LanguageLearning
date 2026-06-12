import type { Conversation, Settings, VocabWord } from "./types";

/**
 * The single module that touches localStorage. Everything is namespaced and
 * versioned so a future migration (or a move to a real database) touches only
 * this file. All reads are SSR-safe and tolerate corrupt/missing data.
 */

const PREFIX = "cakap.v1.";
const KEYS = {
  settings: PREFIX + "settings",
  vocab: PREFIX + "vocab",
  conversations: PREFIX + "conversations",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  activeLanguage: "ms",
  level: "beginner",
  voiceEnabled: true,
  showRomanization: true,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — fail silently.
  }
}

export function genId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

// --- Settings ---------------------------------------------------------------

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) };
}

export function saveSettings(settings: Settings): void {
  write(KEYS.settings, settings);
}

// --- Vocabulary -------------------------------------------------------------

export function getVocab(): VocabWord[] {
  return read<VocabWord[]>(KEYS.vocab, []);
}

export function addVocab(word: Omit<VocabWord, "id" | "createdAt">): VocabWord[] {
  const list = getVocab();
  const exists = list.some(
    (w) => w.language === word.language && w.word.trim() === word.word.trim(),
  );
  if (exists) return list;
  const next = [
    { ...word, id: genId(), createdAt: Date.now() },
    ...list,
  ];
  write(KEYS.vocab, next);
  return next;
}

export function removeVocab(id: string): VocabWord[] {
  const next = getVocab().filter((w) => w.id !== id);
  write(KEYS.vocab, next);
  return next;
}

// --- Conversations ----------------------------------------------------------

export function getConversations(): Conversation[] {
  return read<Conversation[]>(KEYS.conversations, []).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
}

export function getConversation(id: string): Conversation | null {
  return getConversations().find((c) => c.id === id) ?? null;
}

export function saveConversation(conversation: Conversation): void {
  const list = getConversations().filter((c) => c.id !== conversation.id);
  write(KEYS.conversations, [conversation, ...list]);
}

export function deleteConversation(id: string): Conversation[] {
  const next = getConversations().filter((c) => c.id !== id);
  write(KEYS.conversations, next);
  return next;
}

// --- Backup -----------------------------------------------------------------

export function exportData(): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: getSettings(),
      vocab: getVocab(),
      conversations: getConversations(),
    },
    null,
    2,
  );
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.settings) write(KEYS.settings, data.settings);
    if (Array.isArray(data.vocab)) write(KEYS.vocab, data.vocab);
    if (Array.isArray(data.conversations))
      write(KEYS.conversations, data.conversations);
    return true;
  } catch {
    return false;
  }
}
