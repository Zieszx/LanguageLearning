import "server-only";
import { createClient } from "./supabase/server";
import type {
  Conversation,
  LanguageCode,
  Scenario,
  Settings,
  VocabWord,
} from "./types";
import { DEFAULT_SETTINGS } from "./storage";

/**
 * Server-side data access backed by Supabase. Every function scopes to the
 * signed-in user (RLS enforces this too). Returns plain domain objects so the
 * client never sees database column names.
 */

async function uid(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// --- Settings ---------------------------------------------------------------

interface SettingsRow {
  theme: string;
  active_language: string;
  level: string;
  voice_enabled: boolean;
  show_romanization: boolean;
}

export async function getSettingsDb(): Promise<Settings> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return DEFAULT_SETTINGS;

  const { data } = await supabase
    .from("settings")
    .select("theme, active_language, level, voice_enabled, show_romanization")
    .eq("user_id", userId)
    .maybeSingle();

  const row = data as SettingsRow | null;
  if (!row) return DEFAULT_SETTINGS;
  return {
    theme: row.theme as Settings["theme"],
    activeLanguage: row.active_language as LanguageCode,
    level: row.level as Settings["level"],
    voiceEnabled: row.voice_enabled,
    showRomanization: row.show_romanization,
  };
}

export async function saveSettingsDb(settings: Settings): Promise<void> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return;
  await supabase.from("settings").upsert({
    user_id: userId,
    theme: settings.theme,
    active_language: settings.activeLanguage,
    level: settings.level,
    voice_enabled: settings.voiceEnabled,
    show_romanization: settings.showRomanization,
    updated_at: new Date().toISOString(),
  });
}

// --- Vocabulary -------------------------------------------------------------

interface VocabRow {
  id: string;
  word: string;
  meaning: string;
  language: string;
  created_at: string;
}

function toVocab(r: VocabRow): VocabWord {
  return {
    id: r.id,
    word: r.word,
    meaning: r.meaning,
    language: r.language as LanguageCode,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function getVocabDb(): Promise<VocabWord[]> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from("vocab")
    .select("id, word, meaning, language, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data as VocabRow[] | null) ?? []).map(toVocab);
}

export async function addVocabDb(
  word: Omit<VocabWord, "id" | "createdAt">,
): Promise<void> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return;

  // Skip duplicates (same word + language).
  const { data: existing } = await supabase
    .from("vocab")
    .select("id")
    .eq("user_id", userId)
    .eq("language", word.language)
    .eq("word", word.word.trim())
    .maybeSingle();
  if (existing) return;

  await supabase.from("vocab").insert({
    user_id: userId,
    word: word.word.trim(),
    meaning: word.meaning,
    language: word.language,
  });
  await logPracticeDb("word_saved", word.language);
}

export async function removeVocabDb(id: string): Promise<void> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return;
  await supabase.from("vocab").delete().eq("user_id", userId).eq("id", id);
}

// --- Conversations ----------------------------------------------------------

interface ConversationRow {
  id: string;
  title: string;
  language_code: string;
  scenario_id: string | null;
  scenario: { character: string; situation: string } | null;
  level: string;
  messages: Conversation["messages"];
  created_at: string;
  updated_at: string;
}

function toConversation(r: ConversationRow): Conversation {
  return {
    id: r.id,
    title: r.title,
    languageCode: r.language_code as LanguageCode,
    scenarioId: r.scenario_id,
    scenario: r.scenario,
    level: r.level as Conversation["level"],
    messages: r.messages ?? [],
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

export async function getConversationsDb(): Promise<Conversation[]> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, title, language_code, scenario_id, scenario, level, messages, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return ((data as ConversationRow[] | null) ?? []).map(toConversation);
}

export async function getConversationDb(
  id: string,
): Promise<Conversation | null> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return null;
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, title, language_code, scenario_id, scenario, level, messages, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  return data ? toConversation(data as ConversationRow) : null;
}

export async function saveConversationDb(c: Conversation): Promise<void> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return;
  await supabase.from("conversations").upsert({
    id: c.id,
    user_id: userId,
    title: c.title,
    language_code: c.languageCode,
    scenario_id: c.scenarioId,
    scenario: c.scenario ?? null,
    level: c.level,
    messages: c.messages,
    updated_at: new Date(c.updatedAt).toISOString(),
  });
}

export async function deleteConversationDb(id: string): Promise<void> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return;
  await supabase
    .from("conversations")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
}

// --- Custom characters ------------------------------------------------------

interface CharacterRow {
  id: string;
  title: string;
  description: string;
  character: string;
  situation: string;
  emoji: string;
  language_code: string | null;
  created_at: string;
}

function toCharacter(r: CharacterRow): Scenario {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    character: r.character,
    situation: r.situation,
    emoji: r.emoji,
    languageCode: (r.language_code as LanguageCode) ?? undefined,
    custom: true,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function getCharactersDb(): Promise<Scenario[]> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from("characters")
    .select(
      "id, title, description, character, situation, emoji, language_code, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data as CharacterRow[] | null) ?? []).map(toCharacter);
}

export async function addCharacterDb(
  s: Omit<Scenario, "id" | "custom" | "createdAt">,
): Promise<Scenario | null> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return null;
  const { data } = await supabase
    .from("characters")
    .insert({
      user_id: userId,
      title: s.title,
      description: s.description,
      character: s.character,
      situation: s.situation,
      emoji: s.emoji,
      language_code: s.languageCode ?? null,
    })
    .select(
      "id, title, description, character, situation, emoji, language_code, created_at",
    )
    .single();
  return data ? toCharacter(data as CharacterRow) : null;
}

export async function removeCharacterDb(id: string): Promise<void> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return;
  await supabase.from("characters").delete().eq("user_id", userId).eq("id", id);
}

// --- Shared scenarios (admin-curated, everyone can use) ---------------------

interface SharedScenarioRow {
  id: string;
  title: string;
  description: string;
  character: string;
  situation: string;
  emoji: string;
  language_code: string | null;
  created_at: string;
}

function toShared(r: SharedScenarioRow): Scenario {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    character: r.character,
    situation: r.situation,
    emoji: r.emoji,
    languageCode: (r.language_code as LanguageCode) ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function getSharedScenariosDb(): Promise<Scenario[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shared_scenarios")
    .select(
      "id, title, description, character, situation, emoji, language_code, created_at",
    )
    .order("created_at", { ascending: false });
  return ((data as SharedScenarioRow[] | null) ?? []).map(toShared);
}

export async function addSharedScenarioDb(
  s: Omit<Scenario, "id" | "custom" | "createdAt">,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("shared_scenarios").insert({
    title: s.title,
    description: s.description,
    character: s.character,
    situation: s.situation,
    emoji: s.emoji,
    language_code: s.languageCode ?? null,
  });
}

export async function removeSharedScenarioDb(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("shared_scenarios").delete().eq("id", id);
}

// --- Practice events (streaks / progress) -----------------------------------

export async function logPracticeDb(
  kind: "message" | "word_saved" | "review",
  language: LanguageCode | null,
): Promise<void> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return;
  await supabase
    .from("practice_events")
    .insert({ user_id: userId, kind, language_code: language });
}

// --- Progress / streaks -----------------------------------------------------

export interface Progress {
  totalMessages: number;
  wordsLearned: number;
  reviewsDone: number;
  streak: number;
  /** Last 14 days, oldest first: { date: 'YYYY-MM-DD', count }. */
  daily: { date: string; count: number }[];
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getProgressDb(): Promise<Progress> {
  const empty: Progress = {
    totalMessages: 0,
    wordsLearned: 0,
    reviewsDone: 0,
    streak: 0,
    daily: [],
  };
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return empty;

  const since = new Date();
  since.setDate(since.getDate() - 60);
  const { data } = await supabase
    .from("practice_events")
    .select("kind, created_at")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());

  const events = (data as { kind: string; created_at: string }[] | null) ?? [];

  const byDay = new Map<string, number>();
  let totalMessages = 0;
  let reviewsDone = 0;
  for (const e of events) {
    const key = dayKey(new Date(e.created_at));
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
    if (e.kind === "message") totalMessages++;
    if (e.kind === "review") reviewsDone++;
  }

  // Streak: count back from today while each day has activity.
  let streak = 0;
  const cursor = new Date();
  while (byDay.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  // If nothing today but something yesterday, the streak is still alive.
  if (streak === 0) {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const c2 = yest;
    while (byDay.has(dayKey(c2))) {
      streak++;
      c2.setDate(c2.getDate() - 1);
    }
  }

  const daily: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    daily.push({ date: key, count: byDay.get(key) ?? 0 });
  }

  const { count: wordsLearned } = await supabase
    .from("vocab")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    totalMessages,
    wordsLearned: wordsLearned ?? 0,
    reviewsDone,
    streak,
    daily,
  };
}

// --- Spaced repetition ------------------------------------------------------

export interface ReviewCard {
  vocabId: string;
  word: string;
  meaning: string;
  language: LanguageCode;
}

interface ReviewRow {
  vocab_id: string;
  due_at: string;
  interval_days: number;
  ease: number;
  reps: number;
}

/** Cards due for review now (includes saved words that have no review yet). */
export async function getDueReviewsDb(): Promise<ReviewCard[]> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return [];

  const [{ data: vocabData }, { data: reviewData }] = await Promise.all([
    supabase
      .from("vocab")
      .select("id, word, meaning, language")
      .eq("user_id", userId),
    supabase
      .from("reviews")
      .select("vocab_id, due_at, interval_days, ease, reps")
      .eq("user_id", userId),
  ]);

  const vocab = (vocabData as VocabWord[] | null) ?? [];
  const reviews = new Map(
    ((reviewData as ReviewRow[] | null) ?? []).map((r) => [r.vocab_id, r]),
  );
  const now = Date.now();

  return vocab
    .filter((v) => {
      const r = reviews.get(v.id);
      return !r || new Date(r.due_at).getTime() <= now;
    })
    .map((v) => ({
      vocabId: v.id,
      word: v.word,
      meaning: v.meaning,
      language: v.language as LanguageCode,
    }));
}

/** Applies an SM-2-style update after grading a card. */
export async function gradeReviewDb(
  vocabId: string,
  grade: "again" | "good" | "easy",
): Promise<void> {
  const supabase = await createClient();
  const userId = await uid();
  if (!userId) return;

  const { data } = await supabase
    .from("reviews")
    .select("vocab_id, due_at, interval_days, ease, reps")
    .eq("user_id", userId)
    .eq("vocab_id", vocabId)
    .maybeSingle();
  const prev = data as ReviewRow | null;

  let ease = prev?.ease ?? 2.5;
  let reps = prev?.reps ?? 0;
  let interval = prev?.interval_days ?? 0;

  if (grade === "again") {
    ease = Math.max(1.3, ease - 0.2);
    reps = 0;
    interval = 0;
  } else {
    if (grade === "easy") ease += 0.15;
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = grade === "easy" ? 4 : 3;
    else interval = Math.round(Math.max(interval, 1) * ease);
  }

  const due = new Date();
  due.setDate(due.getDate() + interval);

  await supabase.from("reviews").upsert({
    vocab_id: vocabId,
    user_id: userId,
    due_at: due.toISOString(),
    interval_days: interval,
    ease,
    reps,
    updated_at: new Date().toISOString(),
  });
  await logPracticeDb("review", null);
}
