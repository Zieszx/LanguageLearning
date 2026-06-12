# Cakap — Speaking-First Language Learning App

**Date:** 2026-06-12
**Status:** Design approved, pending spec review

## 1. Overview

Cakap is a browser-based, speaking-first language learning app inspired by
[Hanashi](https://hanashiapp.com/). Instead of grammar drills and flashcards,
the user practices realistic conversations with an AI partner, saves words they
learn, and receives gentle inline corrections. All user data is stored locally
in the browser (`localStorage`); there is no backend database.

### Goals
- Make practicing conversation low-friction and motivating.
- Work entirely client-side for data, with a thin server route only for AI calls.
- Be provider-agnostic for the AI so the engine can be swapped without a rewrite.

### Non-goals (v1)
- No user accounts, auth, or cloud sync.
- No backend database (data lives in `localStorage`).
- No mobile native apps (responsive web only).

## 2. Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Data:** `localStorage` only, accessed through one typed storage module
- **AI:** Provider-agnostic `/api/chat` route. Default provider **Groq** (free
  tier). Switchable to Anthropic Claude (or others) via environment variables —
  no app code changes.
- **Speech:** Web Speech API (SpeechRecognition for input, SpeechSynthesis for
  read-aloud). Gracefully degrades to text-only where unsupported.
- **Icons:** Lucide (SVG only — never emoji).

## 3. Languages
- **Target languages (learnable):** Malay, Mandarin Chinese, Korean, English.
- **UI language:** English.
- Architecture supports adding more target languages via config; the AI handles
  all of them through prompting, so adding a language is mostly a config entry.

## 4. Visual Design

Soft & friendly modern aesthetic ("claymorphism-lite"), with light and dark mode.

- **Style:** Soft rounded cards (16–24px radius), gentle layered shadows (no hard
  lines), soft 200ms press/transition animations.
- **Palette (light):** Primary `#4F46E5` (indigo), secondary `#818CF8`,
  success/CTA `#22C55E` (green), background `#EEF2FF`, text `#312E81`.
- **Dark mode:** Deep indigo/navy surfaces, lighter indigo accents, same green
  CTA, high-contrast text. Toggle persisted in `localStorage`; respects system
  preference on first load.
- **Typography:** Varela Round (headings) + Nunito Sans (body).
- **Accessibility:** ≥4.5:1 text contrast in both modes, visible focus states,
  44px+ touch targets, `aria-label`s on icon buttons, `prefers-reduced-motion`
  respected.

## 5. Screens

1. **Home / Dashboard** — choose a language; see scenario entry points, a "free
   chat" button, vocab summary, and streak/goal status.
2. **Scenario Picker** — cards for built-in scenarios (e.g. order food, job
   interview) plus user-created custom scenarios. Each card shows the situation,
   character, and difficulty.
3. **Conversation** — chat bubbles, mic button (speech input), read-aloud on AI
   messages, "I'm stuck / help" button, tap-a-word-to-save, tap-a-message to
   translate, subtle inline corrections, romanization display.
4. **Vocabulary Bank** — saved words with meanings; spaced-repetition review
   queue; delete; words are fed back into future conversations.
5. **Conversation History** — list of past conversations, reopen to review.
6. **Settings** — target language, theme toggle, voice on/off, romanization
   on/off, data export/import, optional API key field (stored locally for
   advanced users who want to use their own key).

## 6. Features

### Core conversation loop
- **Scenario conversations** — AI roleplays a character in a real-world situation
  in the target language, adapting to the user's level.
- **Free / open chat** — converse about anything with no fixed scenario.
- **Inline feedback / corrections** — AI flags mistakes and briefly explains,
  shown subtly alongside the conversation.
- **Vocabulary bank** — save words from any conversation; saved words are woven
  into future chats.

### Learning aids
- **Romanization + tap-to-translate** — pinyin (Chinese) / romaja (Korean)
  shown under text; tap any message to reveal its English meaning.
- **Post-conversation recap** — after each chat: new words used, corrections
  made, and a simple score.
- **Spaced-repetition review (SRS)** — vocab bank schedules words for review over
  time to aid retention.
- **Pronunciation scoring** — compares spoken input (speech recognition) against
  the target phrase and gives a rough accuracy score.

### Engagement & data
- **Daily streak + goals** — track consecutive active days; set a daily goal;
  celebrate milestones.
- **Conversation history** — save and revisit past conversations.
- **Custom scenarios** — users author their own situation + character.
- **Export / import backup** — export all data to a JSON file and re-import it
  (safety net against `localStorage` being cleared).

## 7. Architecture & Data Flow

### Client
- All state held in React and persisted to `localStorage` through a single typed
  module (`lib/storage.ts`) using versioned keys (e.g. `cakap.v1.vocab`).
- Storage module is the only place that touches `localStorage`, so a future move
  to a real database touches one file.

### Server (thin)
- **`/api/chat`** — a Next.js route handler. Receives the conversation messages
  plus context (scenario, target language, level, relevant saved vocab), builds a
  system prompt, calls the configured provider, and streams the reply back.
- **Provider abstraction** — a small interface (`lib/ai/provider.ts`) with one
  implementation per provider (Groq first). The active provider and model are
  chosen by env vars (`AI_PROVIDER`, `AI_MODEL`, provider API key). The browser
  never sees the API key.

### AI behavior
- A system prompt instructs the model to: roleplay the scenario character, reply
  in the target language at the user's level, weave in saved vocabulary, and
  return structured corrections (so the UI can render them distinctly).
- Translations, romanization, and recap data are produced via dedicated prompts
  (pure request/response), kept separate from the roleplay turn.

### Key modules (isolation boundaries)
- `lib/storage.ts` — typed `localStorage` access (vocab, history, settings,
  streaks, SRS state).
- `lib/ai/provider.ts` + provider impls — AI calls behind one interface.
- `lib/prompts.ts` — pure functions that build prompts from context (unit-testable).
- `lib/srs.ts` — pure spaced-repetition scheduling logic.
- `lib/languages.ts` — language config (name, code, romanization scheme, voices).

## 8. Testing
- Unit tests for pure logic: `lib/storage.ts`, `lib/prompts.ts`, `lib/srs.ts`
  (no network).
- `/api/chat` tested with a mocked provider.
- Manual/responsive checks at 375px, 768px, 1024px, 1440px in both themes.

## 9. Phased Delivery

The full vision above is large; build in phases so a usable app exists early.

- **Phase 1 — Core loop:** Next.js scaffold, theme/design system, storage module,
  provider abstraction (Groq), Home, Scenario Picker, Conversation (text),
  built-in scenarios, free chat, inline corrections, vocabulary bank (save/list).
- **Phase 2 — Speech & aids:** Web Speech input + read-aloud, romanization +
  tap-to-translate, post-conversation recap, pronunciation scoring.
- **Phase 3 — Retention & engagement:** spaced-repetition review, daily streak +
  goals, conversation history, custom scenarios.
- **Phase 4 — Data & polish:** export/import backup, settings completeness,
  accessibility/responsive pass, optional user-supplied API key.

## 10. Open Items / Future
- Swap Groq → Claude (or other) once paid API access is desired (env var only).
- Possible future: cloud sync / accounts, native apps, additional languages.
