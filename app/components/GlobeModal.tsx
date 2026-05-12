"use client";
import { useState, useRef, useEffect } from "react";
import { useCurrency, CURRENCIES } from "../../lib/currency-context";
import { useLocale } from "../../lib/locale-context";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "no", label: "Norwegian", native: "Norsk" },
  { code: "ar", label: "Arabic", native: "العربية", comingSoon: true },
  { code: "fr", label: "French", native: "Français", comingSoon: true },
  { code: "es", label: "Spanish", native: "Español", comingSoon: true },
  { code: "de", label: "German", native: "Deutsch", comingSoon: true },
];

export default function GlobeModal() {
  const { currency, setCurrency } = useCurrency();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"currency" | "language">("currency");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Globe button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: "none",
          border: "1px solid #E2D5C8",
          borderRadius: "999px",
          padding: "6px 12px",
          cursor: "pointer",
          color: "#7A5C44",
          fontSize: "12px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: "500",
          flexShrink: 0,
        }}
        aria-label="Language and currency"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        {currency}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            backgroundColor: "#FDFBF8",
            borderRadius: "16px",
            width: "360px",
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "80vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 40px rgba(26,14,6,0.18)",
            border: "1px solid #E2D5C8",
            zIndex: 1000,
          }}
        >
          {/* Header / tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 0 4px", borderBottom: "1px solid #E2D5C8", flexShrink: 0 }}>
            <div style={{ display: "flex" }}>
              {(["currency", "language"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: tab === t ? "2px solid #1A0E06" : "2px solid transparent",
                    padding: "14px 20px",
                    fontSize: "13px",
                    fontWeight: tab === t ? "500" : "400",
                    color: tab === t ? "#1A0E06" : "#7A5C44",
                    cursor: "pointer",
                    fontFamily: "'Jost', sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#7A5C44", padding: "8px", display: "flex", alignItems: "center", borderRadius: "50%" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
            {tab === "currency" ? (
              <div>
                <p style={{ fontSize: "11px", color: "#C8622A", margin: "0 0 14px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500" }}>SELECT CURRENCY</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {Object.entries(CURRENCIES).map(([code, info]) => {
                    const selected = currency === code;
                    return (
                      <button
                        key={code}
                        onClick={() => { setCurrency(code); setOpen(false); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          border: selected ? "1.5px solid #C8622A" : "1px solid #E2D5C8",
                          borderRadius: "10px",
                          backgroundColor: selected ? "#FBF0EA" : "#FDFBF8",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif" }}>{code}</p>
                          <p style={{ fontSize: "11px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif" }}>{info.name}</p>
                        </div>
                        <span style={{ fontSize: "15px", color: selected ? "#C8622A" : "#DDD0C0", fontFamily: "'Jost', sans-serif" }}>{info.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "11px", color: "#C8622A", margin: "0 0 14px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500" }}>SELECT LANGUAGE</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {LANGUAGES.map((lang) => {
                    const active = !lang.comingSoon;
                    const selected = locale === lang.code;
                    return (
                      <div
                        key={lang.code}
                        onClick={() => { if (active) { setLocale(lang.code as "en" | "no"); setOpen(false); } }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          border: selected ? "1.5px solid #C8622A" : "1px solid #E2D5C8",
                          borderRadius: "10px",
                          backgroundColor: selected ? "#FBF0EA" : "#FDFBF8",
                          cursor: active ? "pointer" : "not-allowed",
                          opacity: active ? 1 : 0.65,
                        }}
                      >
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: selected ? "500" : "400", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif" }}>{lang.label}</p>
                          <p style={{ fontSize: "11px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif" }}>{lang.native}</p>
                        </div>
                        {selected ? (
                          <span style={{ fontSize: "11px", color: "#C8622A", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em" }}>ACTIVE</span>
                        ) : lang.comingSoon ? (
                          <span style={{ fontSize: "11px", color: "#DDD0C0", fontFamily: "'Jost', sans-serif" }}>Coming soon</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
