import Link from "next/link";
import { BookMarked, Flame, GraduationCap, MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProgressDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  await requireUser();
  const p = await getProgressDb();
  const max = Math.max(1, ...p.daily.map((d) => d.count));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Flame className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl text-foreground">Progress</h1>
          <p className="text-sm text-muted-foreground">
            Keep your streak alive by practising every day.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Flame className="h-5 w-5" />} label="Day streak" value={p.streak} />
        <Stat
          icon={<MessageCircle className="h-5 w-5" />}
          label="Messages"
          value={p.totalMessages}
        />
        <Stat
          icon={<BookMarked className="h-5 w-5" />}
          label="Words saved"
          value={p.wordsLearned}
        />
        <Stat
          icon={<GraduationCap className="h-5 w-5" />}
          label="Reviews"
          value={p.reviewsDone}
        />
      </div>

      <section className="clay flex flex-col gap-4 p-5">
        <h2 className="font-display text-lg text-foreground">Last 14 days</h2>
        <div className="flex h-32 items-end justify-between gap-1">
          {p.daily.map((d) => (
            <div
              key={d.date}
              className="flex flex-1 flex-col items-center justify-end gap-1"
              title={`${d.date}: ${d.count}`}
            >
              <div
                className={`w-full rounded-md ${
                  d.count > 0 ? "bg-primary" : "bg-surface-2"
                }`}
                style={{
                  height: `${Math.max(6, (d.count / max) * 100)}%`,
                }}
              />
              <span className="text-[10px] text-muted-foreground">
                {d.date.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/review"
        className="clay clay-press flex cursor-pointer items-center justify-between p-5"
      >
        <div>
          <p className="font-display text-lg text-foreground">
            Review your words
          </p>
          <p className="text-sm text-muted-foreground">
            Spaced-repetition flashcards from your vocabulary.
          </p>
        </div>
        <GraduationCap className="h-5 w-5 text-muted-foreground" />
      </Link>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="clay flex flex-col gap-1 p-4">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-display text-2xl text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
