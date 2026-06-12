import type { Settings } from "./types";

/**
 * Device-level preferences live in localStorage (theme, active language, etc.).
 * User content (vocabulary, conversations) lives in the database — see
 * `lib/data.ts`.
 */

const PREFIX = "cakap.v1.";
const KEYS = {
  settings: PREFIX + "settings",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  activeLanguage: "ms",
  level: "beginner",
  voiceEnabled: true,
  showRomanization: true,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — fail silently.
  }
}

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) };
}

export function saveSettings(settings: Settings): void {
  write(KEYS.settings, settings);
}
