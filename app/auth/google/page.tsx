"use client";
import { useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useTranslations } from "../../../lib/i18n";

export default function GoogleAuth() {
  const t = useTranslations("AuthGoogle");

  useEffect(() => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FDFBF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{ width: "32px", height: "32px", border: "2px solid #E2D5C8", borderTopColor: "#C8622A", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "#7A5C44", letterSpacing: "0.05em", margin: 0 }}>
          {t("loading")}
        </p>
      </div>
    </div>
  );
}
