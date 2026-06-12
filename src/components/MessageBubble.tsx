"use client";

import { useState } from "react";
import { Check, Languages, Plus, Sparkles, Volume2, Wand2 } from "lucide-react";
import { getLanguage } from "@/lib/languages";
import { useAccount } from "@/lib/account";
import { saveVocab } from "@/lib/data";
import type { ChatMessage, LanguageCode } from "@/lib/types";

interface Props {
  message: ChatMessage;
  language: LanguageCode;
  showRomanization: boolean;
}

/** Finds the best installed speech voice for a BCP-47 code, e.g. "ms-MY". */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  code: string,
): SpeechSynthesisVoice | null {
  const target = code.toLowerCase();
  const base = target.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === target) ??
    voices.find((v) => v.lang.toLowerCase().replace("_", "-") === target) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base)) ??
    null
  );
}

export function MessageBubble({ message, language, showRomanization }: Props) {
  const { signedIn } = useAccount();
  const [showTranslation, setShowTranslation] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const lang = getLanguage(language);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="clay-press max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-md bg-primary px-5 py-3 text-primary-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  function speak() {
    try {
      const synth = window.speechSynthesis;

      const run = () => {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = lang.speechCode;
        // Browsers don't auto-pick a voice for the requested language, so a
        // non-English language (Malay, Mandarin, Korean…) often stays silent.
        // Explicitly choose the closest matching installed voice.
        const voice = pickVoice(synth.getVoices(), lang.speechCode);
        if (voice) utterance.voice = voice;
        synth.cancel();
        synth.speak(utterance);
      };

      // Voices load asynchronously in some browsers (notably Chrome): the first
      // getVoices() call returns []. Wait for them before speaking.
      if (synth.getVoices().length === 0) {
        synth.addEventListener("voiceschanged", run, { once: true });
        synth.getVoices(); // nudge the browser to load them
      } else {
        run();
      }
    } catch {
      /* speech not supported */
    }
  }

  function save(word: string, meaning: string) {
    void saveVocab(signedIn, { word, meaning, language });
    setSaved((prev) => ({ ...prev, [word]: true }));
  }

  const corrections = message.corrections ?? [];
  const suggestions = message.vocabSuggestions ?? [];
  const canSpeak =
    typeof window !== "undefined" && "speechSynthesis" in window;

  return (
    <div className="flex max-w-[92%] flex-col gap-2">
      {/* Corrections on the user's previous message */}
      {corrections.length > 0 && (
        <div className="clay-inset flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Wand2 className="h-4 w-4" />
            Gentle fixes
          </div>
          {corrections.map((c, i) => (
            <div key={i} className="text-sm">
              <span className="text-muted-foreground line-through">
                {c.original}
              </span>{" "}
              <span className="font-semibold text-foreground">
                {c.corrected}
              </span>
              <p className="text-muted-foreground">{c.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Assistant reply */}
      <div className="clay rounded-3xl rounded-bl-md px-5 py-3">
        <p className="whitespace-pre-wrap text-foreground">{message.content}</p>

        {showRomanization && lang.hasRomanization && message.romanization && (
          <p className="mt-1 text-sm italic text-muted-foreground">
            {message.romanization}
          </p>
        )}

        {showTranslation && message.translation && (
          <p className="mt-2 border-t border-border pt-2 text-sm text-muted-foreground">
            {message.translation}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {canSpeak && (
            <button
              type="button"
              onClick={speak}
              aria-label="Read aloud"
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <Volume2 className="h-4 w-4" />
              Listen
            </button>
          )}
          {message.translation && (
            <button
              type="button"
              onClick={() => setShowTranslation((v) => !v)}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <Languages className="h-4 w-4" />
              {showTranslation ? "Hide English" : "English"}
            </button>
          )}
        </div>
      </div>

      {/* Suggested words to save */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-secondary">
            <Sparkles className="h-3.5 w-3.5" />
            Save a word
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const isSaved = saved[s.word];
              return (
                <button
                  key={s.word}
                  type="button"
                  onClick={() => save(s.word, s.meaning)}
                  disabled={isSaved}
                  title={s.meaning}
                  className={`clay-press flex cursor-pointer items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isSaved
                      ? "bg-accent/15 text-accent"
                      : "clay-inset text-foreground"
                  }`}
                >
                  {isSaved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {s.word}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
