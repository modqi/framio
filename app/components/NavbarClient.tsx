"use client";
import { useState, useEffect } from "react";
import GlobeModal from "./GlobeModal";
import AuthModal from "./AuthModal";
import { useTranslations } from "@/lib/i18n";

export default function NavbarClient() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Home");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "login" || params.get("auth") === "signup") {
      setOpen(true);
      // Clean the param so a refresh doesn't re-open the modal.
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return (
    <>
      <GlobeModal />
      <a href="/photographers" className="hidden sm:inline" style={{color: "#7A5C44", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("nav.photographers")}</a>
      <button
        onClick={() => setOpen(true)}
        style={{backgroundColor: "#1A0E06", color: "#FDFBF8", border: "none", cursor: "pointer", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em", whiteSpace: "nowrap"}}
      >
        {t("nav.logInOrSignUp")}
      </button>
      <a href="/signup?role=photographer" className="hidden sm:inline" style={{border: "1px solid #C8622A", color: "#C8622A", backgroundColor: "transparent", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em", whiteSpace: "nowrap"}}>{t("nav.joinAsPhotographer")}</a>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
