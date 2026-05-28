"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { COUNTRIES, DEFAULT_COUNTRY, countryFlag, type Country } from "../../lib/countries";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  inputStyle?: React.CSSProperties;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "12 34 56 78",
  searchPlaceholder = "Search country",
  inputStyle = {},
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [number, setNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const emit = useCallback((c: Country, n: string) => {
    onChange(n ? `${c.dial} ${n}` : "");
  }, [onChange]);

  // Sync upward whenever country or number changes
  useEffect(() => { emit(country, number); }, [country, number, emit]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const selectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setSearch("");
  };

  const base: React.CSSProperties = {
    border: "0.5px solid #E2D5C8",
    borderRadius: "10px",
    fontSize: "13px",
    fontFamily: "'Jost', sans-serif",
    color: "#1A0E06",
    backgroundColor: "#FDFBF8",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {/* Country selector */}
      <div ref={wrapperRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            ...base,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "12px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            height: "100%",
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>{countryFlag(country.code)}</span>
          <span style={{ fontWeight: "500" }}>{country.dial}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="#7A5C44" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {open && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            backgroundColor: "#FDFBF8",
            border: "1px solid #E2D5C8",
            borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(26,14,6,0.14)",
            width: "272px",
            overflow: "hidden",
          }}>
            {/* Search */}
            <div style={{ padding: "8px 8px 4px" }}>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: "100%",
                  border: "0.5px solid #E2D5C8",
                  borderRadius: "6px",
                  padding: "7px 10px",
                  fontSize: "12px",
                  fontFamily: "'Jost', sans-serif",
                  outline: "none",
                  backgroundColor: "#F5EFE4",
                  color: "#1A0E06",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* List */}
            <div ref={listRef} style={{ maxHeight: "210px", overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <p style={{ padding: "10px 12px", fontSize: "12px", color: "#DDD0C0", fontFamily: "'Jost', sans-serif", margin: 0 }}>
                  No results
                </p>
              ) : filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => selectCountry(c)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 12px",
                    background: c.code === country.code ? "#FBF0EA" : "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1 }}>{countryFlag(c.code)}</span>
                  <span style={{ flex: 1, fontSize: "12px", fontFamily: "'Jost', sans-serif", color: "#1A0E06", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", color: "#7A5C44", flexShrink: 0 }}>
                    {c.dial}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Number input */}
      <input
        type="tel"
        value={number}
        onChange={e => setNumber(e.target.value.replace(/[^\d\s\-\(\)]/g, ""))}
        placeholder={placeholder}
        style={{ ...base, ...inputStyle, flex: 1, padding: "12px 16px" }}
      />
    </div>
  );
}
