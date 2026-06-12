"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(params.get("redirect") || "/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Logo size={56} className="shadow-lg" />
        <h1 className="font-display text-2xl text-foreground">
          Welcome to Cakap
        </h1>
        <p className="text-sm text-muted-foreground">Sign in to keep talking.</p>
      </div>

      <form onSubmit={handleSubmit} className="clay flex w-full max-w-sm flex-col gap-4 p-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="clay-inset rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
          className="clay-press flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-display text-lg text-primary-foreground disabled:opacity-50"
        >
          <LogIn className="h-5 w-5" />
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          New accounts are created by an administrator.
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="clay h-40 animate-pulse rounded-3xl" />}>
      <LoginInner />
    </Suspense>
  );
}
