import type { LanguageCode } from "./types";

export interface LanguageInfo {
  code: LanguageCode;
  /** English name shown in the UI. */
  name: string;
  /** Name written in the language itself. */
  nativeName: string;
  flag: string;
  /** Whether to offer romanization (pinyin / romaja). */
  hasRomanization: boolean;
  romanizationLabel: string;
  /** BCP-47 tag for the Web Speech API. */
  speechCode: string;
}

export const LANGUAGES: LanguageInfo[] = [
  {
    code: "ms",
    name: "Malay",
    nativeName: "Bahasa Melayu",
    flag: "🇲🇾",
    hasRomanization: false,
    romanizationLabel: "",
    speechCode: "ms-MY",
  },
  {
    code: "zh",
    name: "Mandarin Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    hasRomanization: true,
    romanizationLabel: "Pinyin",
    speechCode: "zh-CN",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    hasRomanization: true,
    romanizationLabel: "Romaja",
    speechCode: "ko-KR",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    hasRomanization: false,
    romanizationLabel: "",
    speechCode: "en-US",
  },
];

export function getLanguage(code: LanguageCode): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
