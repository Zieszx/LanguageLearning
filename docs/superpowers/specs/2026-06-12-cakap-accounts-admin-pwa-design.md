# Cakap v2 — Accounts, Admin & PWA

**Date:** 2026-06-12
**Status:** Built on branch `feature/accounts-admin-pwa`, pending setup + review
**Supersedes** the "localStorage only / no accounts" parts of the v1 spec.

## Why
The app needs real access control: only invited users may use it (protecting
the shared Gemini quota), and an admin manages accounts. localStorage cannot
enforce this, so v2 adds a backend.

## Stack additions
- **Supabase** (Postgres + Auth) connected to Vercel via the Storage integration.
- `@supabase/supabase-js` + `@supabase/ssr` for browser/server/admin clients.
- Auth via cookies, refreshed in `src/proxy.ts` (Next 16's renamed middleware).

## Auth & roles
- **Email + password.** Public sign-up disabled; **admins invite users by email**
  (Supabase invite link → `/auth/confirm` → `/set-password`).
- `profiles` table holds `role` (`admin` | `user`) and `disabled`.
- First admin is bootstrapped with a one-time SQL `update`.

## Data model (Postgres, with Row-Level Security)
- `profiles`, `vocab`, `conversations` (messages as JSONB), `usage` (per-user/day).
- RLS: users access only their own rows; admins may read all. Enforced by the DB.
- `increment_usage(user_id)` RPC counts messages atomically.
- Device-level prefs (theme, language, level) remain in `localStorage`.

## Routes
- `/login`, `/set-password`, `/auth/confirm` — auth flow (no header).
- `/`, `/chat`, `/vocab`, `/settings` — user app, gated by login; data from DB.
- `/admin` — admin-only (guarded in layout): invite users, set role, disable/
  enable, delete, and see per-user messages-today.
- `/api/chat` — verifies session, blocks disabled accounts, enforces
  `DAILY_MESSAGE_LIMIT`, increments usage. Service-role key stays server-side.

## PWA
- `app/manifest.ts`, generated `/icon-192.png` & `/icon-512.png` (next/og),
  `public/sw.js` (network-first, API never cached), registered client-side.
- `viewport.themeColor`, Apple web-app meta. Installable + offline shell.

## Responsive
- Tailwind responsive layout (`max-w-3xl`, fluid grids); header collapses to
  icon-only nav on small screens. Verified across 375 / 768 / 1024 / 1440.

## Required setup (one-time, by the owner)
1. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor.
2. Vercel env (Production + Preview): add `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_SITE_URL`; confirm `SUPABASE_SERVICE_ROLE_KEY` (from integration)
   and `GEMINI_API_KEY` exist. Optional `DAILY_MESSAGE_LIMIT`.
3. Supabase → Authentication: disable new-user sign-ups; set Site URL + redirect
   URLs to include `/auth/confirm` and `/set-password`.
4. Create your own user, then `update public.profiles set role='admin' where
   email='<you>';` to become the first admin.

## Deferred (future phases)
Speech input, SRS review, streaks/goals, conversation-history page, custom
scenarios, post-conversation recap, per-user usage analytics dashboard,
push notifications.
