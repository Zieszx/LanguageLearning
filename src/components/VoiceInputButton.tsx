"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

// Minimal typings for the Web Speech API (not in the standard DOM lib).
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Props {
  /** BCP-47 language tag, e.g. "ms-MY". */
  lang: string;
  /** Receives recognized text to append to the composer. */
  onText: (text: string) => void;
}

/** A mic button that dictates speech into the chat composer. */
export function VoiceInputButton({ lang, onText }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => recognitionRef.current?.stop();
  }, []);

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      if (text.trim()) onText(text.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop dictation" : "Speak your message"}
      aria-pressed={listening}
      className={`clay-press flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl transition-colors ${
        listening
          ? "animate-pulse bg-accent text-accent-foreground"
          : "clay-inset text-muted-foreground hover:text-foreground"
      }`}
    >
      {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  );
}
