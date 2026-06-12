"use server";

import {
  addCharacterDb,
  addVocabDb,
  deleteConversationDb,
  getCharactersDb,
  getConversationDb,
  getConversationsDb,
  getDueReviewsDb,
  getSettingsDb,
  getSharedScenariosDb,
  getVocabDb,
  gradeReviewDb,
  logPracticeDb,
  removeCharacterDb,
  removeVocabDb,
  saveConversationDb,
  saveSettingsDb,
  type ReviewCard,
} from "@/lib/db";
import type {
  Conversation,
  LanguageCode,
  Scenario,
  Settings,
  VocabWord,
} from "@/lib/types";

// Settings
export async function actionGetSettings(): Promise<Settings> {
  return getSettingsDb();
}
export async function actionSaveSettings(settings: Settings): Promise<void> {
  return saveSettingsDb(settings);
}

// Vocab
export async function actionGetVocab(): Promise<VocabWord[]> {
  return getVocabDb();
}
export async function actionAddVocab(
  word: Omit<VocabWord, "id" | "createdAt">,
): Promise<VocabWord[]> {
  await addVocabDb(word);
  return getVocabDb();
}
export async function actionRemoveVocab(id: string): Promise<VocabWord[]> {
  await removeVocabDb(id);
  return getVocabDb();
}

// Conversations
export async function actionGetConversations(): Promise<Conversation[]> {
  return getConversationsDb();
}
export async function actionGetConversation(
  id: string,
): Promise<Conversation | null> {
  return getConversationDb(id);
}
export async function actionSaveConversation(c: Conversation): Promise<void> {
  return saveConversationDb(c);
}
export async function actionDeleteConversation(id: string): Promise<void> {
  return deleteConversationDb(id);
}

// Characters
export async function actionGetCharacters(): Promise<Scenario[]> {
  return getCharactersDb();
}
export async function actionAddCharacter(
  s: Omit<Scenario, "id" | "custom" | "createdAt">,
): Promise<Scenario | null> {
  return addCharacterDb(s);
}
export async function actionRemoveCharacter(id: string): Promise<Scenario[]> {
  await removeCharacterDb(id);
  return getCharactersDb();
}

// Practice
export async function actionLogPractice(
  kind: "message" | "word_saved" | "review",
  language: LanguageCode | null,
): Promise<void> {
  return logPracticeDb(kind, language);
}

// Shared scenarios (read-only for normal users)
export async function actionGetSharedScenarios(): Promise<Scenario[]> {
  return getSharedScenariosDb();
}

// Reviews (spaced repetition)
export async function actionGetDueReviews(): Promise<ReviewCard[]> {
  return getDueReviewsDb();
}
export async function actionGradeReview(
  vocabId: string,
  grade: "again" | "good" | "easy",
): Promise<void> {
  return gradeReviewDb(vocabId, grade);
}

/** One-time migration: push local (browser) data up to the account. */
export async function actionMigrateLocal(payload: {
  settings?: Settings;
  vocab?: VocabWord[];
  conversations?: Conversation[];
  characters?: Scenario[];
}): Promise<void> {
  if (payload.settings) await saveSettingsDb(payload.settings);
  for (const w of payload.vocab ?? []) {
    await addVocabDb({ word: w.word, meaning: w.meaning, language: w.language });
  }
  for (const c of payload.conversations ?? []) {
    await saveConversationDb(c);
  }
  for (const ch of payload.characters ?? []) {
    await addCharacterDb({
      title: ch.title,
      description: ch.description,
      character: ch.character,
      situation: ch.situation,
      emoji: ch.emoji,
      languageCode: ch.languageCode,
    });
  }
}
