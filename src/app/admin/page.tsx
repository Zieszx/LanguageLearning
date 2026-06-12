import { Plus, Shield, ShieldOff, Trash2, Users, Wand2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSharedScenariosDb } from "@/lib/db";
import { LANGUAGES } from "@/lib/languages";
import {
  createSharedScenario,
  deleteSharedScenario,
  setUserRole,
} from "./actions";

export const dynamic = "force-dynamic";

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin";
  created_at: string;
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, shared] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, display_name, role, created_at")
      .order("created_at", { ascending: false }),
    getSharedScenariosDb(),
  ]);

  const rows = (profiles as ProfileRow[] | null) ?? [];
  const adminCount = rows.filter((r) => r.role === "admin").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <Shield className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {admin.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Users" value={rows.length} />
        <Stat label="Admins" value={adminCount} />
        <Stat label="Learners" value={rows.length - adminCount} />
      </div>

      <section className="clay flex flex-col gap-3 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
          <Users className="h-5 w-5 text-muted-foreground" />
          People
        </h2>
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {r.display_name || r.email || "Unknown"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {r.email}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    r.role === "admin"
                      ? "bg-secondary/15 text-secondary"
                      : "bg-surface-2 text-muted-foreground"
                  }`}
                >
                  {r.role}
                </span>
                {r.id !== admin.id && (
                  <form
                    action={setUserRole.bind(
                      null,
                      r.id,
                      r.role === "admin" ? "user" : "admin",
                    )}
                  >
                    <button
                      type="submit"
                      aria-label={
                        r.role === "admin" ? "Demote to user" : "Make admin"
                      }
                      title={
                        r.role === "admin" ? "Demote to user" : "Make admin"
                      }
                      className="clay-press flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {r.role === "admin" ? (
                        <ShieldOff className="h-4 w-4" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="py-3 text-sm text-muted-foreground">
              No users yet.
            </li>
          )}
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        Use the shield button to promote or demote a user. The first admin must
        be set once in the Supabase <code>profiles</code> table.
      </p>

      {/* Content management: shared scenarios */}
      <section className="clay flex flex-col gap-4 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
          <Wand2 className="h-5 w-5 text-muted-foreground" />
          Shared scenarios
        </h2>
        <p className="text-sm text-muted-foreground">
          These appear for every signed-in learner alongside the built-in ones.
        </p>

        <ul className="flex flex-col divide-y divide-border">
          {shared.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  <span className="mr-2" aria-hidden>
                    {s.emoji}
                  </span>
                  {s.title}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {s.description}
                </p>
              </div>
              <form action={deleteSharedScenario.bind(null, s.id)}>
                <button
                  type="submit"
                  aria-label={`Delete ${s.title}`}
                  className="clay-press flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </li>
          ))}
          {shared.length === 0 && (
            <li className="py-3 text-sm text-muted-foreground">
              No shared scenarios yet.
            </li>
          )}
        </ul>

        <form action={createSharedScenario} className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex gap-2">
            <input
              name="emoji"
              defaultValue="🎭"
              aria-label="Emoji"
              maxLength={4}
              className="clay-inset w-16 rounded-2xl px-3 py-2.5 text-center text-foreground outline-none"
            />
            <input
              name="title"
              required
              placeholder="Title (e.g. Strict landlord)"
              className="clay-inset flex-1 rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <textarea
            name="character"
            required
            rows={2}
            placeholder="Personality / who the AI plays"
            className="clay-inset resize-none rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
          />
          <textarea
            name="situation"
            rows={2}
            placeholder="Situation (optional)"
            className="clay-inset resize-none rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
          />
          <select
            name="language"
            defaultValue=""
            aria-label="Language"
            className="clay-inset rounded-2xl px-4 py-2.5 text-foreground outline-none"
          >
            <option value="">Any language (uses learner&apos;s)</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="clay-press flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            <Plus className="h-5 w-5" />
            Add shared scenario
          </button>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="clay flex flex-col gap-1 p-4">
      <span className="font-display text-2xl text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
