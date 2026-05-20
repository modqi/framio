"use client";
import { useTranslations } from "@/lib/i18n";

export default function HomeFooterTagline() {
  const t = useTranslations("Home");
  return (
    <p style={{fontSize: "12px", color: "#7A5C44", margin: "16px 0 0", maxWidth: "280px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t("footer.tagline")}</p>
  );
}
