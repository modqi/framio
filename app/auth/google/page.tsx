"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useTranslations } from "../../../lib/i18n";

// Hardcoded — never taken from URL params
const REDIRECT_TO = "https://www.lomissa.com/auth/callback";

const RL_KEY = "lomissa_google_rl";
const RL_MAX = 10;
const RL_WINDOW_MS = 60_000;

function checkRateLimit(): boolean {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(RL_KEY);
    let data: { count: number; windowStart: number } = { count: 0, windowStart: now };
    if (raw) {
      const parsed = JSON.parse(raw);
      if (now - parsed.windowStart < RL_WINDOW_MS) data = parsed;
    }
    data.count++;
    localStorage.setItem(RL_KEY, JSON.stringify(data));
    if (data.count > RL_MAX) {
      console.warn(`[/auth/google] Rate limit: ${data.count} loads in 60 s window`);
      return false;
    }
    return true;
  } catch {
    return true; // Allow through if localStorage is unavailable (private mode, etc.)
  }
}

export default function GoogleAuth() {
  const t = useTranslations("AuthGoogle");
  const [state, setState] = useState<"loading" | "error" | "rate_limited">("loading");

  useEffect(() => {
    if (!checkRateLimit()) {
      setState("rate_limited");
      return;
    }

    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: REDIRECT_TO },
    }).then(({ error }) => {
      if (error) {
        console.error("[/auth/google] OAuth init failed");
        setState("error");
      }
    });
  }, []);

  if (state === "error" || state === "rate_limited") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FDFBF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "320px", padding: "0 24px" }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "#C8622A", margin: "0 0 16px", lineHeight: "1.6" }}>
            {t("error")}
          </p>
          <a href="/" style={{ fontFamily: "'Jost', sans-serif", fontSize: "13px", color: "#7A5C44", textDecoration: "none" }}>
            ← Back to Lomissa
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FDFBF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid #E2D5C8", borderTopColor: "#C8622A", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "#7A5C44", letterSpacing: "0.05em", margin: 0 }}>
          {t("loading")}
        </p>
      </div>
    </div>
  );
}
