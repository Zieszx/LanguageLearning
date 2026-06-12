"use client";

/**
 * Plays natural speech for some text via the /api/tts endpoint (Gemini TTS),
 * falling back to the browser's built-in voice if that isn't configured or
 * fails. Audio is cached per text so replays are instant.
 */

const cache = new Map<string, string>(); // text -> object URL
let current: HTMLAudioElement | null = null;
let ttsAvailable = true; // flips off after a 503 so we stop trying

export function stopSpeech() {
  if (current) {
    current.pause();
    current = null;
  }
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* not supported */
  }
}

interface Options {
  /** BCP-47 tag for the browser fallback voice, e.g. "ko-KR". */
  fallbackLang: string;
  onEnd?: () => void;
}

export async function speak(text: string, opts: Options): Promise<void> {
  stopSpeech();
  const clean = text.trim();
  if (!clean) return;

  if (ttsAvailable) {
    try {
      let url = cache.get(clean);
      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean }),
        });
        if (res.status === 503) {
          ttsAvailable = false; // not configured; don't retry this session
          throw new Error("tts-unconfigured");
        }
        if (!res.ok) throw new Error("tts-failed");
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        cache.set(clean, url);
      }
      const audio = new Audio(url);
      current = audio;
      audio.onended = () => {
        if (current === audio) current = null;
        opts.onEnd?.();
      };
      await audio.play();
      return;
    } catch {
      /* fall through to the browser voice */
    }
  }

  fallbackSpeak(clean, opts);
}

// --- Browser Web Speech fallback -------------------------------------------

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

function fallbackSpeak(text: string, opts: Options) {
  try {
    const synth = window.speechSynthesis;
    const run = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = opts.fallbackLang;
      const voice = pickVoice(synth.getVoices(), opts.fallbackLang);
      if (voice) utterance.voice = voice;
      utterance.onend = () => opts.onEnd?.();
      synth.cancel();
      synth.speak(utterance);
    };
    if (synth.getVoices().length === 0) {
      synth.addEventListener("voiceschanged", run, { once: true });
      synth.getVoices();
    } else {
      run();
    }
  } catch {
    opts.onEnd?.();
  }
}
