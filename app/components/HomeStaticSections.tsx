"use client";
import { useTranslations } from "@/lib/i18n";

export default function HomeStaticSections() {
  const t = useTranslations("Home");

  return (
    <>
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
            <div style={{position: "absolute", inset: 0, background: "#DDD0C0", borderRadius: "12px", transform: "rotate(5deg) translateY(14px) translateX(10px)", boxShadow: "0 8px 32px rgba(28,16,9,0.10)"}} />
            <div style={{position: "absolute", inset: 0, background: "#EDE3D1", borderRadius: "12px", transform: "rotate(-3deg) translateY(7px)", boxShadow: "0 8px 32px rgba(28,16,9,0.08)"}} />
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
          {[
            t("trustBar.item1"),
            t("trustBar.item2"),
            t("trustBar.item3"),
            t("trustBar.item4"),
          ].map((item, i, arr) => (
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
    </>
  );
}
