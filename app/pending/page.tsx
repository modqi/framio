"use client";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import { useTranslations } from "../../lib/i18n";

export default function Pending() {
  const t = useTranslations("Pending");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen flex flex-col" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <button
          onClick={handleSignOut}
          style={{fontSize: "13px", color: "#7A5C44", background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
        >
          {t("nav.signOut")}
        </button>
      </nav>

      <div className="flex flex-col items-center justify-center flex-1" style={{padding: "48px 32px"}}>
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "16px", padding: "48px 32px", border: "1px solid #E2D5C8", textAlign: "center", maxWidth: "480px", width: "100%"}}>
          <div style={{fontSize: "48px", marginBottom: "24px"}}>⏳</div>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px", letterSpacing: "-0.02em"}}>
            {t("heading")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            {t("description")}
          </p>
          <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "16px", marginBottom: "32px", textAlign: "left"}}>
            {([t("step1"), t("step2"), t("step3"), t("step4")] as string[]).map((step, i) => (
              <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 3 ? "10px" : "0"}}>
                <span style={{fontSize: "12px", color: "#C8622A", flexShrink: 0, fontWeight: "600", fontFamily: "'Jost', sans-serif"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{step}</span>
              </div>
            ))}
          </div>
          <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
            {t("contact")}{" "}
            <a href="mailto:hello@lomissa.com" style={{color: "#C8622A", textDecoration: "none"}}>hello@lomissa.com</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}
