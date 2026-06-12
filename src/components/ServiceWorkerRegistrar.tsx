"use client";

import { useEffect } from "react";

/** Registers the PWA service worker once, on the client. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failed — app still works without offline support */
      });
    }
  }, []);
  return null;
}
