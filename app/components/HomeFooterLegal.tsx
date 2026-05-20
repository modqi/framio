"use client";
import { useTranslations } from "@/lib/i18n";

export default function HomeFooterLegal() {
  const t = useTranslations("Home");
  return (
    <div>
      <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("footer.legalLabel")}</p>
      <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
        <a href="/privacy-policy" rel="noopener" style={{fontSize: "13px", color: "#C8622A", textDecoration: "underline", fontFamily: "'Jost', sans-serif", fontWeight: "400"}}>{t("footer.privacyPolicy")}</a>
        <a href="/terms-of-service" rel="noopener" style={{fontSize: "13px", color: "#C8622A", textDecoration: "underline", fontFamily: "'Jost', sans-serif", fontWeight: "400"}}>{t("footer.termsOfService")}</a>
      </div>
    </div>
  );
}
