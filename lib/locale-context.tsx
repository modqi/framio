"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "../messages/en.json";
import no from "../messages/no.json";

type Locale = "en" | "no";
const messages: Record<Locale, any> = { en, no };

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lomissa_locale");
    if (saved === "en" || saved === "no") setLocaleState(saved as Locale);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("lomissa_locale", l);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
