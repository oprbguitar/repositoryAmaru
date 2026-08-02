import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  dictionary,
  type Language,
  resolveInitialLanguage,
  type TranslationKey,
} from "./dictionary";

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "amaru-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    resolveInitialLanguage(localStorage.getItem(STORAGE_KEY)),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    // Keep the document language in sync for screen readers and hyphenation.
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => dictionary[language][key] ?? dictionary.es[key],
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside a LanguageProvider");
  return context;
}

/** Shorthand for components that only need the translate function. */
export function useT(): (key: TranslationKey) => string {
  return useLanguage().t;
}
