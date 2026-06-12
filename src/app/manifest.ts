import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cakap — Speak a new language",
    short_name: "Cakap",
    description:
      "Practice real conversations in Malay, Mandarin, Korean and English with a friendly AI partner.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef2ff",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
