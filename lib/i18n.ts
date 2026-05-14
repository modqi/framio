"use client";
import { useContext } from "react";
import { LocaleContext } from "./locale-context";

export function useTranslations(namespace: string) {
  const { messages } = useContext(LocaleContext);
  return function t(key: string, params?: Record<string, any>): string {
    const ns = namespace.split(".").reduce((obj: any, p) => obj?.[p], messages);
    const value = key.split(".").reduce((obj: any, p) => obj?.[p], ns ?? {});
    if (typeof value !== "string") return key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  };
}
