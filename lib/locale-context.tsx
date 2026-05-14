"use client";
import { createContext, useContext, useState, useEffect } from "react";
import en from "../messages/en.json";
import no from "../messages/no.json";

type Locale = "en" | "no";
const MESSAGES: Record<Locale, any> = { en, no };

export const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  messages: Record<string, any>;
}>({ locale: "en", setLocale: () => {}, messages: en });

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lomissa_locale");
    if (saved === "en" || saved === "no") setLocaleState(saved as Locale);
    setMounted(true);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("lomissa_locale", l);
  };

  const activeLocale: Locale = mounted ? locale : "en";
  return (
    <LocaleContext.Provider value={{ locale: activeLocale, setLocale, messages: MESSAGES[activeLocale] }}>
      {children}
    </LocaleContext.Provider>
  );
}
