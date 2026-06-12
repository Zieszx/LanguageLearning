"use client";

import { useRef, useState } from "react";
import { Download, Monitor, Moon, Settings as SettingsIcon, Sun, Upload } from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { LANGUAGES } from "@/lib/languages";
import { exportData, importData } from "@/lib/storage";
import type { Level, ThemePreference } from "@/lib/types";

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="clay flex flex-col gap-3 p-5">
      <h2 className="font-display text-lg text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        checked ? "bg-accent" : "bg-surface-2"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { settings, update, loaded } = useSettings();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!loaded) {
    return <div className="clay h-40 animate-pulse rounded-3xl" />;
  }

  function handleExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cakap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    const text = await file.text();
    const ok = importData(text);
    setImportMsg(
      ok
        ? "Backup imported. Reloading…"
        : "That file could not be read as a Cakap backup.",
    );
    if (ok) setTimeout(() => window.location.reload(), 900);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <SettingsIcon className="h-6 w-6" />
        </span>
        <h1 className="font-display text-2xl text-foreground">Settings</h1>
      </div>

      <Card title="Appearance">
        <div className="flex flex-wrap gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => {
            const active = settings.theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => update({ theme: value })}
                className={`clay-press flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "clay-inset text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Default language">
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => {
            const active = settings.activeLanguage === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => update({ activeLanguage: l.code })}
                className={`clay-press flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "clay-inset text-foreground"
                }`}
              >
                <span aria-hidden>{l.flag}</span>
                {l.name}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Default level">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((level) => {
            const active = settings.level === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => update({ level })}
                className={`clay-press cursor-pointer rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  active
                    ? "bg-secondary text-white"
                    : "clay-inset text-foreground"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Conversation">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Read-aloud & mic</p>
            <p className="text-sm text-muted-foreground">
              Enable speech features where supported.
            </p>
          </div>
          <Toggle
            label="Voice features"
            checked={settings.voiceEnabled}
            onChange={(v) => update({ voiceEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Show romanization</p>
            <p className="text-sm text-muted-foreground">
              Pinyin / romaja under non-Latin text.
            </p>
          </div>
          <Toggle
            label="Show romanization"
            checked={settings.showRomanization}
            onChange={(v) => update({ showRomanization: v })}
          />
        </div>
      </Card>

      <Card title="Your data">
        <p className="text-sm text-muted-foreground">
          Everything is stored only in this browser. Export a backup so you
          don’t lose your words and conversations.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="clay-press flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" />
            Export backup
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="clay-press clay-inset flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-foreground"
          >
            <Upload className="h-4 w-4" />
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
            }}
          />
        </div>
        {importMsg && (
          <p className="text-sm text-muted-foreground">{importMsg}</p>
        )}
      </Card>
    </div>
  );
}
