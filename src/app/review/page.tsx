"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, GraduationCap, Loader2, Volume2 } from "lucide-react";
import { getLanguage } from "@/lib/languages";
import { speak as speakText } from "@/lib/speak";
import { actionGetDueReviews, actionGradeReview } from "@/app/data-actions";
import type { ReviewCard } from "@/lib/db";
import type { LanguageCode } from "@/lib/types";

export default function ReviewPage() {
  const [cards, setCards] = useState<ReviewCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    let active = true;
    void actionGetDueReviews().then((c) => active && setCards(c));
    return () => {
      active = false;
    };
  }, []);

  function speak(text: string, code: LanguageCode) {
    void speakText(text, { fallbackLang: getLanguage(code).speechCode });
  }

  async function grade(g: "again" | "good" | "easy") {
    if (!cards) return;
    const card = cards[index];
    await actionGradeReview(card.vocabId, g);
    setDone((d) => d + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (cards === null) {
    return <div className="clay h-40 animate-pulse rounded-3xl" />;
  }

  const card = cards[index];
  const finished = index >= cards.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <GraduationCap className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl text-foreground">Review</h1>
          <p className="text-sm text-muted-foreground">
            {finished
              ? `${done} reviewed`
              : `${cards.length - index} card${
                  cards.length - index === 1 ? "" : "s"
                } to go`}
          </p>
        </div>
      </div>

      {finished ? (
        <div className="clay flex flex-col items-center gap-3 p-8 text-center">
          <span className="text-4xl" aria-hidden>
            🎉
          </span>
          <p className="font-display text-lg text-foreground">
            {done > 0 ? "All done for now!" : "Nothing due right now"}
          </p>
          <p className="text-sm text-muted-foreground">
            {done > 0
              ? "Come back later for the next batch."
              : "Save words during chats and they'll show up here."}
          </p>
          <Link
            href="/"
            className="clay-press mt-2 cursor-pointer rounded-2xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
          >
            Back home
          </Link>
        </div>
      ) : (
        <>
          <div className="clay flex min-h-56 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="text-3xl" aria-hidden>
              {getLanguage(card.language).flag}
            </span>
            <p className="font-display text-3xl text-foreground">{card.word}</p>
            <button
              type="button"
              onClick={() => speak(card.word, card.language)}
              aria-label="Read aloud"
              className="clay-press clay-inset flex cursor-pointer items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold text-muted-foreground"
            >
              <Volume2 className="h-4 w-4" />
              Listen
            </button>

            {revealed && (
              <p className="mt-2 border-t border-border pt-3 text-lg text-muted-foreground">
                {card.meaning || "(no meaning saved)"}
              </p>
            )}
          </div>

          {revealed ? (
            <div className="grid grid-cols-3 gap-2">
              <GradeButton
                label="Again"
                tone="bg-red-500/15 text-red-600 dark:text-red-300"
                onClick={() => void grade("again")}
              />
              <GradeButton
                label="Good"
                tone="bg-secondary/15 text-secondary"
                onClick={() => void grade("good")}
              />
              <GradeButton
                label="Easy"
                tone="bg-accent/15 text-accent"
                onClick={() => void grade("easy")}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="clay-press flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-display text-lg text-primary-foreground"
            >
              <Check className="h-5 w-5" />
              Show meaning
            </button>
          )}
        </>
      )}
    </div>
  );
}

function GradeButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: string;
  onClick: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        onClick();
      }}
      className={`clay-press flex cursor-pointer items-center justify-center gap-1 rounded-2xl px-4 py-3 font-semibold ${tone} disabled:opacity-60`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  );
}
