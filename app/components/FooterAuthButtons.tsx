"use client";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { useTranslations } from "@/lib/i18n";

export default function FooterAuthButtons() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Home");
  return (
    <>
      <button onClick={() => setOpen(true)} style={{background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", padding: "0", textAlign: "left"}}>{t("footer.createAccount")}</button>
      <button onClick={() => setOpen(true)} style={{background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", padding: "0", textAlign: "left"}}>{t("nav.logIn")}</button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
