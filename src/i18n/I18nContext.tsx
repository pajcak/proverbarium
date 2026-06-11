import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LanguageCode } from "../data/types";
import { TRANSLATIONS, type Translation } from "./translations";

interface I18nValue {
  language: LanguageCode;
  t: Translation;
  setLanguage: (code: LanguageCode) => void;
}

const STORAGE_KEY = "proverbia.language";
const DEFAULT_LANGUAGE: LanguageCode = "cs";

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLanguage(): LanguageCode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "cs" || stored === "en") return stored;
  } catch {
    // localStorage unavailable (private mode, SSR) — fall back to default.
  }
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    document.documentElement.lang = code;
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Persisting the preference is best-effort.
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ language, t: TRANSLATIONS[language], setLanguage }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
