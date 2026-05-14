"use client";
import { useState, useRef, useEffect } from "react";
import { useCurrency, CURRENCIES } from "../../lib/currency-context";
import { useLocale } from "../../lib/locale-context";

const LANGUAGES = [
  { code: "en", label: "English",   native: "English"    },
  { code: "no", label: "Norwegian", native: "Norsk"       },
  { code: "ar", label: "Arabic",    native: "العربية",    comingSoon: true },
  { code: "fr", label: "French",    native: "Français",   comingSoon: true },
  { code: "es", label: "Spanish",   native: "Español",    comingSoon: true },
  { code: "de", label: "German",    native: "Deutsch",    comingSoon: true },
];

const W_CURRENCY = 340;
const W_LANGUAGE = 300;

// Calculates a left-offset CSS string that keeps the dropdown on screen.
// The dropdown prefers its right edge aligned to the button's right edge,
// but clamps so left >= 16px and right <= viewport - 16px.
function clampedLeft(buttonRight: number, dropWidth: number): string {
  return `max(16px, min(${Math.round(buttonRight - dropWidth)}px, calc(100vw - ${dropWidth + 16}px)))`;
}

function useDropdown(dropWidth: number) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropRef   = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, leftCss: "0px" });

  const toggle = () => {
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, leftCss: clampedLeft(r.right, dropWidth) });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!dropRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return { open, setOpen, toggle, buttonRef, dropRef, pos };
}

const pillBtn: React.CSSProperties = {
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
};

function DropHeader({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #E2D5C8", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <p style={{ fontSize: "11px", color: "#C8622A", margin: 0, letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500" }}>{label}</p>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A5C44", padding: "4px", display: "flex", alignItems: "center" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ── Currency button ───────────────────────────────────────────────────────────

export function CurrencyButton() {
  const { currency, setCurrency } = useCurrency();
  const { open, setOpen, toggle, buttonRef, dropRef, pos } = useDropdown(W_CURRENCY);

  return (
    <>
      <button ref={buttonRef} onClick={toggle} style={pillBtn} aria-label="Select currency">
        {/* banknote icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="10" rx="2"/>
          <circle cx="12" cy="12" r="2.5"/>
          <path d="M6 12h.01M18 12h.01"/>
        </svg>
        <span className="hidden sm:inline">{currency}</span>
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: `${pos.top}px`,
            left: pos.leftCss,
            width: `${W_CURRENCY}px`,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "80vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FDFBF8",
            borderRadius: "16px",
            border: "1px solid #E2D5C8",
            boxShadow: "0 8px 40px rgba(26,14,6,0.18)",
            zIndex: 1000,
          }}
        >
          <DropHeader label="SELECT CURRENCY" onClose={() => setOpen(false)} />
          <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
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
                      <p style={{ fontSize: "11px", color: "#7A5C44", margin: 0, fontFamily: "'Jost', sans-serif" }}>{info.name}</p>
                    </div>
                    <span style={{ fontSize: "15px", color: selected ? "#C8622A" : "#DDD0C0", fontFamily: "'Jost', sans-serif" }}>{info.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Language button ───────────────────────────────────────────────────────────

export function LanguageButton() {
  const { locale, setLocale } = useLocale();
  const { open, setOpen, toggle, buttonRef, dropRef, pos } = useDropdown(W_LANGUAGE);

  return (
    <>
      <button ref={buttonRef} onClick={toggle} style={pillBtn} aria-label="Select language">
        {/* globe icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: `${pos.top}px`,
            left: pos.leftCss,
            width: `${W_LANGUAGE}px`,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "80vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FDFBF8",
            borderRadius: "16px",
            border: "1px solid #E2D5C8",
            boxShadow: "0 8px 40px rgba(26,14,6,0.18)",
            zIndex: 1000,
          }}
        >
          <DropHeader label="SELECT LANGUAGE" onClose={() => setOpen(false)} />
          <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
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
                      <p style={{ fontSize: "11px", color: "#7A5C44", margin: 0, fontFamily: "'Jost', sans-serif" }}>{lang.native}</p>
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
        </div>
      )}
    </>
  );
}

// ── Default export (used by all pages unchanged) ──────────────────────────────

export default function GlobeModal() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <CurrencyButton />
      <LanguageButton />
    </div>
  );
}
