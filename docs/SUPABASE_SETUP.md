# Supabase setup (auth + data sync)

Cakap uses Supabase for sign-in and per-user data. Follow these steps once.

## 1. Run the schema

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the contents of [`supabase/schema.sql`](../supabase/schema.sql) and **Run**.

This creates the `profiles`, `settings`, `vocab`, `conversations`, `characters`,
`practice_events` and `reviews` tables, with Row Level Security so each user can
only see their own data. A trigger auto-creates a profile when someone signs up.

## 2. Set environment variables

In **Vercel → Project → Settings → Environment Variables** (and `.env.local` for
local dev) set:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → Publishable key (or use `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the anon key) |

> ⚠️ The browser key **must** use the `NEXT_PUBLIC_` prefix, otherwise the
> client can't read it and sign-in silently won't work. A key named just
> `SUPABASE_ANON_KEY` is **not** exposed to the browser.

The `SUPABASE_SECRET_KEY` / service-role key is **not** used by the app and
should never be exposed to the browser.

## 3. Configure auth

- Supabase → **Authentication → Providers → Email**: enable it.
- For the smoothest start you can turn **off** "Confirm email" (Authentication →
  Sign In / Providers) so new accounts work immediately. If you leave it on,
  users must click the email link before signing in.
- Supabase → **Authentication → URL Configuration**: set the **Site URL** to your
  deployed URL (e.g. `https://your-app.vercel.app`) and add it to redirect URLs.

## 4. Make yourself an admin

After signing up once, in Supabase → **Table Editor → profiles**, find your row
and change `role` from `user` to `admin`. The **Admin** link then appears in the
header and `/admin` unlocks.

## Notes

- If the Supabase env vars are absent, the app falls back to local-only mode
  (no login) so it still runs.
- Data created while signed out (in local mode) lives in the browser; signing in
  migrates it to your account the first time.
