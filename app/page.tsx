"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Logo from "./components/Logo";
import { CalendarIcon, ReviewStarIcon } from "./components/Icons";
import GlobeModal from "./components/GlobeModal";
import { useCurrency } from "../lib/currency-context";
import { CATEGORY_KEY } from "../lib/categories";
import { useTranslations } from "../lib/i18n";

export default function Home() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const { formatPrice } = useCurrency();
  const t = useTranslations("Home");
  const tCat = useTranslations("Categories");

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*, photographer_packages(id, price)")
        .eq("stripe_onboarding_completed", true)
        .order("created_at", { ascending: false });
      const withPackages = (data || []).filter((p: any) => p.photographer_packages?.length > 0);
      setPhotographers(withPackages.slice(0, 6));
    };
    getData();
  }, []);

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo size="sm" />
        <div className="flex items-center gap-2 sm:gap-4">
          <GlobeModal />
          <a href="/photographers" className="hidden sm:inline" style={{color: "#7A5C44", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("nav.photographers")}</a>
          <a href="/login" style={{color: "#7A5C44", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em", whiteSpace: "nowrap"}}>{t("nav.logIn")}</a>
          <a href="/signup" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em", whiteSpace: "nowrap"}}>{t("nav.signUp")}</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{minHeight: "100vh", backgroundColor: "#FDFBF8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 48px 80px", textAlign: "center", position: "relative", overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(184,85,40,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(193,98,47,0.04) 0%, transparent 40%)", pointerEvents: "none"}}/>
        <div style={{position: "relative", zIndex: 1, maxWidth: "800px"}}>
          <div style={{display: "flex", justifyContent: "center", marginBottom: "48px"}}>
            <Logo size="xl" asLink={false} />
          </div>
          <div style={{display: "inline-block", backgroundColor: "rgba(184,85,40,0.08)", border: "1px solid rgba(184,85,40,0.2)", borderRadius: "999px", padding: "6px 16px", marginBottom: "40px"}}>
            <p style={{fontSize: "12px", color: "#C8622A", margin: "0", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("hero.badge")}</p>
          </div>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(44px, 7vw, 84px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 24px", letterSpacing: "-0.02em", lineHeight: "1.05"}}>
            {t("hero.headline")}
          </h1>
          <p style={{fontSize: "clamp(15px, 2vw, 18px)", color: "#7A5C44", margin: "0 0 52px", lineHeight: "1.8", maxWidth: "520px", marginLeft: "auto", marginRight: "auto", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            {t("hero.description")}
          </p>
          <a href="/photographers" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "15px", padding: "16px 44px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em", boxShadow: "0 4px 20px rgba(184,85,40,0.35)"}}>
            {t("hero.cta")}
          </a>
          <p style={{fontSize: "12px", color: "#DDD0C0", margin: "28px 0 0", letterSpacing: "0.1em", fontFamily: "'Jost', sans-serif"}}>
            {t("hero.trust")}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section style={{backgroundColor: "#F5EFE4", padding: "100px 48px"}}>
        <div style={{maxWidth: "1000px", margin: "0 auto"}}>
          <div style={{textAlign: "center", marginBottom: "72px"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("howItWorks.label")}</p>
            <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1A0E06", margin: "0", letterSpacing: "-0.02em"}}>
              {t("howItWorks.heading")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { number: "01", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Desc" },
              { number: "02", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Desc" },
              { number: "03", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Desc" },
            ].map((step) => (
              <div key={step.number}>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "56px", fontWeight: "300", color: "#E2D5C8", margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: "1"}}>{step.number}</p>
                <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1A0E06", margin: "0 0 12px"}}>{t(step.titleKey as any)}</h3>
                <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t(step.descKey as any)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured photographers */}
      {photographers.length > 0 && (
        <section style={{backgroundColor: "#FDFBF8", padding: "100px 48px"}}>
          <div style={{maxWidth: "1100px", margin: "0 auto"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "56px", flexWrap: "wrap", gap: "16px"}}>
              <div>
                <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("featured.label")}</p>
                <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1A0E06", margin: "0", letterSpacing: "-0.02em"}}>
                  {t("featured.heading")}
                </h2>
              </div>
              <a href="/photographers" style={{fontSize: "13px", color: "#C8622A", textDecoration: "none", border: "1px solid rgba(184,85,40,0.3)", padding: "10px 24px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
                {t("featured.viewAll")}
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {photographers.map((photographer) => (
                <a key={photographer.id} href={`/photographers/${photographer.id}`} style={{textDecoration: "none", display: "block", backgroundColor: "#FDFBF8", borderRadius: "12px", overflow: "hidden", border: "1px solid #E2D5C8", boxShadow: "0 2px 12px rgba(28,16,9,0.06)"}}>
                  <div style={{height: "220px", backgroundColor: "#E2D5C8", backgroundImage: photographer.profile_photo ? "none" : "repeating-linear-gradient(-45deg,#E2D5C8,#E2D5C8 6px,#EDE3D1 6px,#EDE3D1 14px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
                    {photographer.profile_photo ? (
                      <img src={photographer.profile_photo} alt={photographer.name} style={{width: "100%", height: "100%", objectFit: "cover"}} />
                    ) : (
                      <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "72px", fontWeight: "400", color: "#C8622A", opacity: 0.5}}>{photographer.name?.[0]}</span>
                    )}
                  </div>
                  <div style={{padding: "24px"}}>
                    <div style={{display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "6px"}}>
                      {(photographer.specialities?.length > 0
                        ? photographer.specialities.slice(0, 2)
                        : photographer.specialty ? [photographer.specialty] : []
                      ).map((cat: string) => (
                        <span key={cat} style={{fontSize: "10px", color: "#C8622A", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", padding: "2px 8px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.03em"}}>{CATEGORY_KEY[cat] ? tCat(CATEGORY_KEY[cat]) : cat}</span>
                      ))}
                    </div>
                    <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{photographer.name}</h3>
                    <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>{photographer.location}</p>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                      <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}><svg viewBox="0 0 64 64" width="14" height="14" fill="none" style={{display:"inline-block",verticalAlign:"middle",marginRight:"3px"}}><circle cx="32" cy="32" r="9" fill="#C8622A"/><line x1="32" y1="18" x2="32" y2="10" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="46" y1="32" x2="54" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="42" y1="22" x2="48" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="22" x2="16" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/></svg>{photographer.rating || "New"}</span>
                      <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1A0E06"}}>
                        {(() => {
                          const prices = (photographer.photographer_packages || []).map((p: any) => p.price).filter((n: number) => n > 0);
                          return prices.length > 0 ? formatPrice(Math.min(...prices)) : "";
                        })()}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust section */}
      <section style={{backgroundColor: "#F5EFE4", padding: "100px 48px"}}>
        <div style={{maxWidth: "800px", margin: "0 auto", textAlign: "center"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("trust.label")}</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 56px", letterSpacing: "-0.02em", lineHeight: "1.1"}}>
            {t("trust.heading")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <svg viewBox="0 0 64 64" width="22" height="22" fill="none"><circle cx="32" cy="32" r="22" stroke="#FDFBF8" strokeWidth="1.6"/><polyline points="20,32 28,40 44,24" stroke="#FDFBF8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, titleKey: "trust.vettedTitle", descKey: "trust.vettedDesc" },
              { icon: <CalendarIcon size={22} color="#FDFBF8"/>, titleKey: "trust.bookingTitle", descKey: "trust.bookingDesc" },
              { icon: <ReviewStarIcon size={22} color="#FDFBF8"/>, titleKey: "trust.reviewsTitle", descKey: "trust.reviewsDesc" },
            ].map((item) => (
              <div key={item.titleKey}>
                <div style={{width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#FDFBF8", border: "1px solid #E2D5C8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", margin: "0 auto 20px"}}>
                  {item.icon}
                </div>
                <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1A0E06", margin: "0 0 12px"}}>{t(item.titleKey as any)}</h3>
                <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t(item.descKey as any)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "48px", borderTop: "1px solid #E2D5C8"}}>
        <div style={{maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px"}}>
          <div>
            <Logo size="md" asLink={false} />
            <p style={{fontSize: "12px", color: "#7A5C44", margin: "16px 0 0", maxWidth: "280px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t("footer.tagline")}</p>
          </div>
          <div style={{display: "flex", gap: "48px", flexWrap: "wrap"}}>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("footer.platformLabel")}</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/photographers" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("footer.findPhotographers")}</a>
                <a href="/signup" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("footer.createAccount")}</a>
                <a href="/login" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("nav.logIn")}</a>
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("footer.legalLabel")}</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/privacy" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Privacy Policy</a>
                <a href="/terms" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Terms of Service</a>
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("footer.photographersLabel")}</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/signup" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("footer.applyToJoin")}</a>
                <a href="mailto:hello@lomissa.com" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>hello@lomissa.com</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: "1100px", margin: "32px auto 0", paddingTop: "32px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
          <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
          <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("footer.taglineBottom")}</p>
        </div>
      </footer>

    </main>
  );
}
