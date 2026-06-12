import type { Metadata } from "next";
import { Varela_Round, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { getProfile, getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AccountProvider } from "@/lib/account";
import { MigrateOnLogin } from "@/components/MigrateOnLogin";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  const signedIn = user !== null;
  return (
    <html lang="en" className={`${varela.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AccountProvider value={{ signedIn }}>
          <MigrateOnLogin />
          <Header
            authEnabled={isSupabaseConfigured}
            account={
              signedIn ? { isAdmin: profile?.role === "admin" } : null
            }
          />
          <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
            {children}
          </main>
        </AccountProvider>
      </body>
    </html>
  );
}
