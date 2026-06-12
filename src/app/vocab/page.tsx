"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookMarked, Trash2 } from "lucide-react";
import { getLanguage } from "@/lib/languages";
import { useAccount } from "@/lib/account";
import { deleteVocab, loadVocab } from "@/lib/data";
import type { VocabWord } from "@/lib/types";

export default function VocabPage() {
  const { signedIn } = useAccount();
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void loadVocab(signedIn).then((w) => {
      if (!active) return;
      setWords(w);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [signedIn]);

  function handleRemove(id: string) {
    void deleteVocab(signedIn, id).then(setWords);
  }

  if (!loaded) {
    return <div className="clay h-40 animate-pulse rounded-3xl" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <BookMarked className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl text-foreground">
            Vocabulary bank
          </h1>
          <p className="text-sm text-muted-foreground">
            {words.length} saved {words.length === 1 ? "word" : "words"} · woven
            into future chats
          </p>
        </div>
      </div>

      {words.length === 0 ? (
        <div className="clay flex flex-col items-center gap-3 p-8 text-center">
          <span className="text-4xl" aria-hidden>
            📒
          </span>
          <p className="font-display text-lg text-foreground">
            No words yet
          </p>
          <p className="text-sm text-muted-foreground">
            Tap “Save a word” during a conversation and it will appear here.
          </p>
          <Link
            href="/"
            className="clay-press mt-2 cursor-pointer rounded-2xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
          >
            Start practicing
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {words.map((w) => (
            <li
              key={w.id}
              className="clay flex items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-foreground">
                  <span className="mr-2" aria-hidden>
                    {getLanguage(w.language).flag}
                  </span>
                  {w.word}
                </p>
                {w.meaning && (
                  <p className="text-sm text-muted-foreground">{w.meaning}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(w.id)}
                aria-label={`Delete ${w.word}`}
                className="clay-press flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
