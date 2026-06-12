"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Wand2, X } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { useAccount } from "@/lib/account";
import { createCharacter } from "@/lib/data";
import type { LanguageCode } from "@/lib/types";

interface Props {
  /** Default language to preselect (the user's active language). */
  defaultLanguage: LanguageCode;
  /** Called after a character is saved so the parent can refresh its list. */
  onCreated: () => void;
}

const EMOJIS = ["🎭", "😏", "😎", "🤬", "🥸", "👻", "🧑‍🍳", "🧑‍⚕️", "👮", "🧙"];

export function CharacterCreator({ defaultLanguage, onCreated }: Props) {
  const router = useRouter();
  const { signedIn } = useAccount();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [character, setCharacter] = useState("");
  const [situation, setSituation] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [languageCode, setLanguageCode] = useState<LanguageCode>(defaultLanguage);
  const [query, setQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [query]);

  function reset() {
    setTitle("");
    setCharacter("");
    setSituation("");
    setEmoji(EMOJIS[0]);
    setLanguageCode(defaultLanguage);
    setQuery("");
  }

  async function handleCreate() {
    const name = title.trim();
    const persona = character.trim();
    if (!name || !persona) return;

    const created = await createCharacter(signedIn, {
      title: name,
      description: persona,
      character: persona,
      situation:
        situation.trim() ||
        `You're having a casual, everyday conversation with the learner. Stay fully in character as ${name}.`,
      emoji,
      languageCode,
    });
    if (!created) return;

    onCreated();
    reset();
    setOpen(false);
    router.push(`/chat?scenario=${created.id}`);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="clay clay-press flex cursor-pointer flex-col items-center justify-center gap-2 p-5 text-center"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Plus className="h-6 w-6" />
        </span>
        <span className="font-display text-lg text-foreground">
          Create your own character
        </span>
        <span className="text-sm text-muted-foreground">
          A rude friend, a strict boss, a gossipy neighbour… you decide.
        </span>
      </button>
    );
  }

  const canCreate = title.trim() && character.trim();

  return (
    <section className="clay flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg text-foreground">
          <Wand2 className="h-5 w-5 text-accent" />
          New character
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          aria-label="Cancel"
          className="clay-press flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Emoji */}
      <div className="flex flex-wrap gap-2">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            aria-label={`Pick emoji ${e}`}
            className={`clay-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-xl ${
              emoji === e ? "bg-accent/20" : "clay-inset"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Name */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-muted-foreground">
          Name
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rude friend"
          className="clay-inset rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      {/* Personality */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-muted-foreground">
          Personality
        </span>
        <textarea
          value={character}
          onChange={(e) => setCharacter(e.target.value)}
          rows={2}
          placeholder="e.g. A blunt, sarcastic friend who teases you but secretly cares."
          className="clay-inset resize-none rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      {/* Situation (optional) */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-muted-foreground">
          Situation <span className="font-normal">(optional)</span>
        </span>
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          rows={2}
          placeholder="e.g. You bump into them at a street food stall."
          className="clay-inset resize-none rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      {/* Language (searchable) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Language
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a language…"
          aria-label="Search a language"
          className="clay-inset rounded-2xl px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex flex-wrap gap-2">
          {filteredLanguages.map((l) => {
            const active = languageCode === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguageCode(l.code)}
                className={`clay-press flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
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
          {filteredLanguages.length === 0 && (
            <p className="text-sm text-muted-foreground">No language matches.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleCreate()}
        disabled={!canCreate}
        className="clay-press mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 font-display text-lg text-accent-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-5 w-5" />
        Create & start chatting
      </button>
    </section>
  );
}
