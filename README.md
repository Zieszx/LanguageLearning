# Cakap 🗣️

A speaking-first language learning web app. Practice real conversations in
**Malay, Mandarin Chinese, Korean and English** with a friendly AI partner,
save words you learn, and get gentle inline corrections — all in your browser.

Inspired by [Hanashi](https://hanashiapp.com/). Design spec:
[`docs/superpowers/specs`](docs/superpowers/specs).

## Stack
- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **localStorage** for all user data (no database)
- Provider-agnostic AI via `/api/chat`, defaulting to **Google Gemini** (free tier)
- Soft & friendly "claymorphism-lite" UI with light/dark mode

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` (copy from `.env.example`) and add your Gemini API key
   from [Google AI Studio](https://aistudio.google.com/app/apikey):
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Deploying to Vercel
1. Import this repo into [Vercel](https://vercel.com/new) (preset: Next.js).
2. Add an **Environment Variable** `GEMINI_API_KEY` with your key.
3. Deploy. Every push to `main` redeploys automatically.

> The API key lives only in server-side environment variables and is never sent
> to the browser.

## Switching AI providers
The app talks to a single provider interface (`src/lib/ai/provider.ts`). To use
a different model or provider, change `AI_PROVIDER` / `AI_MODEL` env vars and add
an implementation alongside `src/lib/ai/gemini.ts`.

## Roadmap
v1 (this build) covers the core conversation loop, vocabulary bank, corrections,
translation, romanization, read-aloud, light/dark, and data export/import.
Later phases add speech input, spaced-repetition review, streaks & goals,
conversation history, and custom scenarios. See the design spec for details.
