"use client";
import { useTranslations } from "@/lib/i18n";

export default function HomeFooterPhotographers() {
  const t = useTranslations("Home");
  return (
    <div>
      <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("footer.photographersLabel")}</p>
      <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
        <a href="/signup?role=photographer" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("footer.applyToJoin")}</a>
        <a href="mailto:hello@lomissa.com" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>hello@lomissa.com</a>
      </div>
    </div>
  );
}
