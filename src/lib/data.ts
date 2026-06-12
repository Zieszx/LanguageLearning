"use client";

/**
 * Unified client data API. When the user is signed in, everything goes through
 * Supabase server actions; otherwise it falls back to browser localStorage.
 * Pages pass the current `signedIn` flag (from `useAccount()`).
 */

import * as local from "./storage";
import {
  actionAddCharacter,
  actionAddVocab,
  actionDeleteConversation,
  actionGetCharacters,
  actionGetConversation,
  actionGetConversations,
  actionGetSettings,
  actionGetVocab,
  actionLogPractice,
  actionGetSharedScenarios,
  actionRemoveCharacter,
  actionRemoveVocab,
  actionSaveConversation,
  actionSaveSettings,
} from "@/app/data-actions";
import type {
  Conversation,
  LanguageCode,
  Scenario,
  Settings,
  VocabWord,
} from "./types";

// --- Settings ---
export async function loadSettings(signedIn: boolean): Promise<Settings> {
  return signedIn ? actionGetSettings() : local.getSettings();
}
export async function persistSettings(
  signedIn: boolean,
  s: Settings,
): Promise<void> {
  // Always cache locally so the no-flash theme script (which reads
  // localStorage) stays correct, then sync to the cloud when signed in.
  local.saveSettings(s);
  if (signedIn) await actionSaveSettings(s);
}

// --- Vocab ---
export async function loadVocab(signedIn: boolean): Promise<VocabWord[]> {
  return signedIn ? actionGetVocab() : local.getVocab();
}
export async function saveVocab(
  signedIn: boolean,
  word: Omit<VocabWord, "id" | "createdAt">,
): Promise<VocabWord[]> {
  return signedIn ? actionAddVocab(word) : local.addVocab(word);
}
export async function deleteVocab(
  signedIn: boolean,
  id: string,
): Promise<VocabWord[]> {
  return signedIn ? actionRemoveVocab(id) : local.removeVocab(id);
}

// --- Conversations ---
export async function loadConversations(
  signedIn: boolean,
): Promise<Conversation[]> {
  return signedIn ? actionGetConversations() : local.getConversations();
}
export async function loadConversation(
  signedIn: boolean,
  id: string,
): Promise<Conversation | null> {
  return signedIn ? actionGetConversation(id) : local.getConversation(id);
}
export async function storeConversation(
  signedIn: boolean,
  c: Conversation,
): Promise<void> {
  if (signedIn) await actionSaveConversation(c);
  else local.saveConversation(c);
}
export async function removeConversation(
  signedIn: boolean,
  id: string,
): Promise<void> {
  if (signedIn) await actionDeleteConversation(id);
  else local.deleteConversation(id);
}

// --- Characters ---
export async function loadCharacters(signedIn: boolean): Promise<Scenario[]> {
  return signedIn ? actionGetCharacters() : local.getCustomScenarios();
}
export async function createCharacter(
  signedIn: boolean,
  s: Omit<Scenario, "id" | "custom" | "createdAt">,
): Promise<Scenario | null> {
  return signedIn ? actionAddCharacter(s) : local.addCustomScenario(s);
}
export async function deleteCharacter(
  signedIn: boolean,
  id: string,
): Promise<Scenario[]> {
  return signedIn ? actionRemoveCharacter(id) : local.removeCustomScenario(id);
}

// --- Shared scenarios (admin-curated) ---
export async function loadSharedScenarios(
  signedIn: boolean,
): Promise<Scenario[]> {
  // Shared scenarios only exist when Supabase is in play.
  return signedIn ? actionGetSharedScenarios() : [];
}

// --- Practice ---
export async function logPractice(
  signedIn: boolean,
  kind: "message" | "word_saved" | "review",
  language: LanguageCode | null,
): Promise<void> {
  if (signedIn) await actionLogPractice(kind, language);
}
