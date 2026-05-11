"use client";
import { createContext, useContext, useEffect, useState } from "react";

export const CURRENCIES: Record<string, { name: string; symbol: string; symbolAfter?: boolean }> = {
  NOK: { name: "Norwegian Krone", symbol: "kr", symbolAfter: true },
  EUR: { name: "Euro",            symbol: "€" },
  USD: { name: "US Dollar",       symbol: "$" },
  GBP: { name: "British Pound",   symbol: "£" },
  SEK: { name: "Swedish Krona",   symbol: "kr", symbolAfter: true },
  DKK: { name: "Danish Krone",    symbol: "kr", symbolAfter: true },
  AED: { name: "UAE Dirham",      symbol: "د.إ", symbolAfter: true },
};

interface CurrencyContextValue {
  currency: string;
  setCurrency: (c: string) => void;
  formatPrice: (nokAmount: number) => string;
  convertPrice: (priceStr: string) => string;
  ratesReady: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "NOK",
  setCurrency: () => {},
  formatPrice: (n) => `${n.toLocaleString()} NOK`,
  convertPrice: (s) => s,
  ratesReady: false,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState("NOK");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ratesReady, setRatesReady] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lomissa_currency") : null;
    if (saved && CURRENCIES[saved]) setCurrencyState(saved);

    fetch("https://api.exchangerate-api.com/v4/latest/NOK")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) { setRates(data.rates); setRatesReady(true); }
      })
      .catch(() => { setRatesReady(true); }); // fail silently, fall back to NOK
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") localStorage.setItem("lomissa_currency", c);
  };

  const formatPrice = (nokAmount: number): string => {
    if (!nokAmount && nokAmount !== 0) return "—";
    const info = CURRENCIES[currency] ?? CURRENCIES.NOK;
    const rate = currency === "NOK" ? 1 : (rates[currency] ?? 1);
    const converted = Math.round(nokAmount * rate);
    const formatted = converted.toLocaleString();
    return info.symbolAfter ? `${formatted} ${info.symbol}` : `${info.symbol}${formatted}`;
  };

  const convertPrice = (priceStr: string): string => {
    if (!priceStr) return "—";
    if (currency === "NOK" || !ratesReady) return priceStr;
    const cleaned = String(priceStr).replace(/[\s ]/g, "").replace(/[^0-9]/g, "");
    const amount = parseInt(cleaned, 10);
    if (isNaN(amount) || amount === 0) return priceStr;
    return formatPrice(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice, ratesReady }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
