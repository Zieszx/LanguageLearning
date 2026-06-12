"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await createClient().auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setReady(true);
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (!ready) {
    return <div className="clay h-40 animate-pulse rounded-3xl" />;
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg">
          <KeyRound className="h-6 w-6" />
        </span>
        <h1 className="font-display text-2xl text-foreground">
          Set your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a password to finish setting up your account.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="clay flex w-full max-w-sm flex-col gap-4 p-6"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            New password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="clay-inset rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            Confirm password
          </span>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="clay-inset rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="clay-press cursor-pointer rounded-2xl bg-primary px-5 py-3 font-display text-lg text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save & continue"}
        </button>
      </form>
    </div>
  );
}
