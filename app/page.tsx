"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Logo from "./components/Logo";
import GlobeModal from "./components/GlobeModal";
import AuthModal from "./components/AuthModal";
import { useCurrency } from "../lib/currency-context";
import { CATEGORY_KEY } from "../lib/categories";
import { useTranslations } from "../lib/i18n";

export default function Home() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
      <style>{`
        @media (max-width: 767px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-left { padding: 100px 24px 60px !important; }
          .hero-right { display: none !important; }
          .hero-buttons { flex-wrap: wrap !important; justify-content: flex-start !important; }
          .trust-bar-inner { flex-direction: column !important; gap: 10px !important; text-align: center !important; }
          .trust-bar-dot { display: none !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo size="sm" />
        <div className="flex items-center gap-2 sm:gap-4">
          <GlobeModal />
          <a href="/photographers" className="hidden sm:inline" style={{color: "#7A5C44", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("nav.photographers")}</a>
          <button onClick={() => setAuthModalOpen(true)} style={{backgroundColor: "#1A0E06", color: "#FDFBF8", border: "none", cursor: "pointer", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em", whiteSpace: "nowrap"}}>{t("nav.logInOrSignUp")}</button>
          <a href="/signup?role=photographer" className="hidden sm:inline" style={{border: "1px solid #C8622A", color: "#C8622A", backgroundColor: "transparent", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em", whiteSpace: "nowrap"}}>{t("nav.joinAsPhotographer")}</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh", paddingTop: "65px"}}>

        {/* Left — content */}
        <div className="hero-left" style={{padding: "80px 56px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid #E2D5C8"}}>
          <div style={{display: "inline-block", backgroundColor: "rgba(184,85,40,0.08)", border: "1px solid rgba(184,85,40,0.2)", borderRadius: "999px", padding: "6px 16px", marginBottom: "32px", alignSelf: "flex-start"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("hero.badge")}</p>
          </div>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(40px, 4.5vw, 72px)", fontWeight: "300", fontStyle: "italic", color: "#1A0E06", margin: "0 0 24px", letterSpacing: "-0.02em", lineHeight: "1.05"}}>
            {t("hero.headline")}
          </h1>
          <p style={{fontSize: "15px", color: "#7A5C44", margin: "0 0 40px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300", maxWidth: "440px"}}>
            {t("hero.description")}
          </p>
          <div className="hero-buttons" style={{display: "flex", gap: "12px", marginBottom: "32px"}}>
            <a href="/photographers" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "14px", padding: "14px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em", boxShadow: "0 4px 20px rgba(184,85,40,0.3)", whiteSpace: "nowrap"}}>
              {t("hero.cta")}
            </a>
            <a href="/signup?role=photographer" style={{color: "#1A0E06", fontSize: "14px", padding: "14px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", border: "1px solid #1A0E06", whiteSpace: "nowrap"}}>
              {t("hero.ctaSecondary")}
            </a>
          </div>
          <p style={{fontSize: "11px", color: "#DDD0C0", margin: "0", letterSpacing: "0.12em", fontFamily: "'Jost', sans-serif"}}>
            {t("hero.trust")}
          </p>
        </div>

        {/* Right — decorative card collage */}
        <div className="hero-right" style={{backgroundColor: "#F5EFE4", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 56px", position: "relative", overflow: "hidden"}}>
          <div style={{position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 70% 30%, rgba(184,85,40,0.07) 0%, transparent 55%)", pointerEvents: "none"}} />
          <div style={{position: "relative", width: "260px", height: "360px"}}>
            {/* Back card */}
            <div style={{position: "absolute", inset: 0, background: "#DDD0C0", borderRadius: "12px", transform: "rotate(5deg) translateY(14px) translateX(10px)", boxShadow: "0 8px 32px rgba(28,16,9,0.10)"}} />
            {/* Middle card */}
            <div style={{position: "absolute", inset: 0, background: "#EDE3D1", borderRadius: "12px", transform: "rotate(-3deg) translateY(7px)", boxShadow: "0 8px 32px rgba(28,16,9,0.08)"}} />
            {/* Front card */}
            <div style={{position: "absolute", inset: 0, background: "#FDFBF8", borderRadius: "12px", border: "1px solid #E2D5C8", boxShadow: "0 12px 40px rgba(28,16,9,0.12)", overflow: "hidden", display: "flex", flexDirection: "column"}}>
              <div style={{flex: 1, backgroundImage: "repeating-linear-gradient(-45deg,#E2D5C8,#E2D5C8 5px,#EDE3D1 5px,#EDE3D1 12px)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "80px", fontWeight: "300", color: "#C8622A", opacity: 0.3}}>L</span>
              </div>
              <div style={{padding: "16px 18px", borderTop: "1px solid #E2D5C8"}}>
                <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"}}>
                  <div style={{width: "6px", height: "6px", borderRadius: "50%", background: "#C8622A", flexShrink: 0}} />
                  <div style={{height: "8px", width: "90px", background: "#E2D5C8", borderRadius: "4px"}} />
                </div>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <div style={{height: "6px", width: "56px", background: "#F0EAE0", borderRadius: "4px"}} />
                  <div style={{height: "6px", width: "38px", background: "#E8A97E", borderRadius: "4px", opacity: 0.55}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section style={{backgroundColor: "#1A0E06", padding: "18px 48px"}}>
        <div className="trust-bar-inner" style={{maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap"}}>
          {([
            t("trustBar.item1"),
            t("trustBar.item2"),
            t("trustBar.item3"),
            t("trustBar.item4"),
          ] as string[]).map((item, i, arr) => (
            <span key={i} style={{display: "flex", alignItems: "center"}}>
              <span style={{fontSize: "11px", color: "#DDD0C0", letterSpacing: "0.12em", fontFamily: "'Jost', sans-serif", fontWeight: "400", whiteSpace: "nowrap"}}>{item}</span>
              {i < arr.length - 1 && (
                <span className="trust-bar-dot" style={{color: "#3A2A1E", margin: "0 20px", fontSize: "16px", lineHeight: "1"}}>·</span>
              )}
            </span>
          ))}
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
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "48px", fontWeight: "300", color: "#E2D5C8", margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: "1"}}>{step.number}</p>
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
                <button onClick={() => setAuthModalOpen(true)} style={{background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", padding: "0", textAlign: "left"}}>{t("footer.createAccount")}</button>
                <button onClick={() => setAuthModalOpen(true)} style={{background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", padding: "0", textAlign: "left"}}>{t("nav.logIn")}</button>
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("footer.legalLabel")}</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/privacy-policy" rel="noopener" style={{fontSize: "13px", color: "#C8622A", textDecoration: "underline", fontFamily: "'Jost', sans-serif", fontWeight: "400"}}>Privacy Policy</a>
                <a href="/terms-of-service" rel="noopener" style={{fontSize: "13px", color: "#C8622A", textDecoration: "underline", fontFamily: "'Jost', sans-serif", fontWeight: "400"}}>Terms of Service</a>
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("footer.photographersLabel")}</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/signup?role=photographer" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("footer.applyToJoin")}</a>
                <a href="mailto:hello@lomissa.com" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>hello@lomissa.com</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: "1100px", margin: "32px auto 0", paddingTop: "32px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
          <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
          <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("footer.taglineBottom")}</p>
        </div>
        <div style={{maxWidth: "1100px", margin: "20px auto 0", paddingTop: "20px", borderTop: "1px solid #F0EAE0"}}>
          <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t("footer.dataUsage")}</p>
        </div>
      </footer>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </main>
  );
}
