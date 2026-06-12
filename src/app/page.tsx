"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, Sparkles, Trash2 } from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import { SCENARIOS } from "@/lib/scenarios";
import {
  getConversations,
  getCustomScenarios,
  getVocab,
  removeCustomScenario,
} from "@/lib/storage";
import { CharacterCreator } from "@/components/CharacterCreator";
import type { Conversation, Level, Scenario } from "@/lib/types";

const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];

export default function HomePage() {
  const router = useRouter();
  const { settings, update, loaded } = useSettings();
  const [vocabCount, setVocabCount] = useState(0);
  const [recent, setRecent] = useState<Conversation[]>([]);
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    setVocabCount(getVocab().length);
    setRecent(getConversations().slice(0, 3));
    setCustomScenarios(getCustomScenarios());
  }, []);

  function handleDeleteCustom(id: string) {
    setCustomScenarios(removeCustomScenario(id));
  }

  if (!loaded) {
    return <div className="clay h-40 animate-pulse rounded-3xl" />;
  }

  const lang = getLanguage(settings.activeLanguage);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="clay flex flex-col gap-5 p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          Learn by speaking, not just studying
        </div>
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
          Practice {lang.name} in real conversations.
        </h1>

        {/* Language picker */}
        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">
            I want to learn
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const active = l.code === settings.activeLanguage;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => update({ activeLanguage: l.code })}
                  className={`clay-press flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "clay-inset text-foreground"
                  }`}
                >
                  <span aria-hidden>{l.flag}</span>
                  {l.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level picker */}
        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">
            My level
          </p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => {
              const active = level === settings.level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => update({ level })}
                  className={`clay-press cursor-pointer rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition-colors duration-200 ${
                    active
                      ? "bg-secondary text-white"
                      : "clay-inset text-foreground"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/chat?free=1")}
          className="clay-press mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 font-display text-lg text-accent-foreground shadow-lg"
        >
          <MessageCircle className="h-5 w-5" />
          Start a free chat
        </button>
      </section>

      {/* Recent conversations */}
      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl text-foreground">
            Continue practicing
          </h2>
          <div className="flex flex-col gap-2">
            {recent.map((c) => (
              <Link
                key={c.id}
                href={`/chat?c=${c.id}`}
                className="clay clay-press flex cursor-pointer items-center justify-between p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {c.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getLanguage(c.languageCode).name} · {c.messages.length}{" "}
                    messages
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Your characters */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-foreground">Your characters</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CharacterCreator
            defaultLanguage={settings.activeLanguage}
            onCreated={() => setCustomScenarios(getCustomScenarios())}
          />
          {customScenarios.map((s) => {
            const cLang = getLanguage(s.languageCode ?? settings.activeLanguage);
            return (
              <div
                key={s.id}
                className="clay relative flex flex-col gap-2 p-5"
              >
                <button
                  type="button"
                  onClick={() => handleDeleteCustom(s.id)}
                  aria-label={`Delete ${s.title}`}
                  className="clay-press absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link
                  href={`/chat?scenario=${s.id}`}
                  className="clay-press flex cursor-pointer flex-col gap-2"
                >
                  <span className="text-3xl" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="font-display text-lg text-foreground">
                    {s.title}
                  </span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {s.description}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-primary">
                    {cLang.flag} {cLang.name}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Scenarios */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-foreground">
          Or pick a scenario
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <Link
              key={s.id}
              href={`/chat?scenario=${s.id}`}
              className="clay clay-press flex cursor-pointer flex-col gap-2 p-5"
            >
              <span className="text-3xl" aria-hidden>
                {s.emoji}
              </span>
              <span className="font-display text-lg text-foreground">
                {s.title}
              </span>
              <span className="text-sm text-muted-foreground">
                {s.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Vocab summary */}
      <Link
        href="/vocab"
        className="clay clay-press flex cursor-pointer items-center justify-between p-5"
      >
        <div>
          <p className="font-display text-lg text-foreground">
            Vocabulary bank
          </p>
          <p className="text-sm text-muted-foreground">
            {vocabCount} saved {vocabCount === 1 ? "word" : "words"}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </Link>
    </div>
  );
}
