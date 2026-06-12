"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, getSettings, saveSettings } from "./storage";
import { applyTheme } from "./theme";
import type { Settings } from "./types";

/** Reads settings from localStorage on mount and persists updates. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = getSettings();
    setSettings(stored);
    applyTheme(stored.theme);
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      if (patch.theme) applyTheme(patch.theme);
      return next;
    });
  }, []);

  return { settings, update, loaded };
}
