import type { Metadata, Viewport } from "next";
import { Varela_Round, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const varela = Varela_Round({
  weight: "400",
  variable: "--font-varela",
  subsets: ["latin"],
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cakap — Speak a new language",
  description:
    "Practice real conversations in Malay, Mandarin, Korean and English with a friendly AI partner.",
  appleWebApp: { capable: true, title: "Cakap", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

// Applies the saved theme before paint to avoid a flash of the wrong theme.
const themeScript = `
(function () {
  try {
    var raw = localStorage.getItem('cakap.v1.settings');
    var theme = raw ? (JSON.parse(raw).theme || 'system') : 'system';
    var dark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${varela.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ServiceWorkerRegistrar />
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
