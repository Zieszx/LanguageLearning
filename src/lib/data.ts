import { createClient } from "./supabase/client";
import type { ChatMessage, Conversation, LanguageCode, Level, VocabWord } from "./types";

/**
 * Database-backed data access for the signed-in user. Uses the browser
 * Supabase client; Row-Level Security guarantees a user only ever touches
 * their own rows.
 */

type VocabRow = {
  id: string;
  word: string;
  meaning: string;
  language: LanguageCode;
  created_at: string;
};

type ConversationRow = {
  id: string;
  title: string;
  language_code: LanguageCode;
  scenario_id: string | null;
  level: Level;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
};

function toVocab(row: VocabRow): VocabWord {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning,
    language: row.language,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    languageCode: row.language_code,
    scenarioId: row.scenario_id,
    level: row.level,
    messages: row.messages ?? [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// --- Vocabulary -------------------------------------------------------------

export async function getVocab(): Promise<VocabWord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vocab")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as VocabRow[]).map(toVocab);
}

export async function addVocab(input: {
  word: string;
  meaning: string;
  language: LanguageCode;
}): Promise<void> {
  const supabase = createClient();
  const uid = await currentUserId();
  if (!uid) return;

  const { data: existing } = await supabase
    .from("vocab")
    .select("id")
    .eq("language", input.language)
    .eq("word", input.word)
    .maybeSingle();
  if (existing) return;

  await supabase.from("vocab").insert({ ...input, user_id: uid });
}

export async function removeVocab(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("vocab").delete().eq("id", id);
}

// --- Conversations ----------------------------------------------------------

export async function getConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as ConversationRow[]).map(toConversation);
}

export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toConversation(data as ConversationRow);
}

export async function saveConversation(c: Conversation): Promise<void> {
  const supabase = createClient();
  const uid = await currentUserId();
  if (!uid) return;
  await supabase.from("conversations").upsert({
    id: c.id,
    user_id: uid,
    title: c.title,
    language_code: c.languageCode,
    scenario_id: c.scenarioId,
    level: c.level,
    messages: c.messages,
    updated_at: new Date(c.updatedAt).toISOString(),
  });
}

export async function deleteConversation(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("conversations").delete().eq("id", id);
}
