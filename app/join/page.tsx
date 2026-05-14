"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import { ReviewStarIcon } from "../components/Icons";
import { useTranslations } from "../../lib/i18n";
import { CATEGORIES, CATEGORY_KEY } from "../../lib/categories";

export default function JoinAsPhotographer() {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    location: "",
    experience: "",
    instagram: "",
    website: "",
    portfolio_link: "",
    about: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherSpecialty, setOtherSpecialty] = useState("");
  const t = useTranslations("Join");
  const tCat = useTranslations("Categories");

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone_number || !form.about) {
      setError(t("errors.fillRequired"));
      return;
    }
    setSaving(true);
    setError("");

    const finalSpecialities = [...selectedCategories];

    const { error } = await supabase.from("applications").insert({
      name: form.name,
      email: form.email,
      phone_number: form.phone_number || null,
      location: form.location,
      specialty: finalSpecialities.join(", ") || "",
      other_specialty: finalSpecialities.includes("Other") ? (otherSpecialty.trim() || null) : null,
      experience: form.experience,
      instagram: form.instagram,
      website: form.website,
      portfolio_link: form.portfolio_link,
      about: form.about,
      status: "pending",
    });

    if (error) {
      setError(t("errors.genericError"));
    } else {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photographerName: "Lomissa Team",
          photographerEmail: "muhannadsedqi@gmail.com",
          clientName: form.name,
          clientEmail: "muhannadsedqi@gmail.com",
          type: "photographer_application",
          date: new Date().toLocaleDateString(),
          location: form.location,
          message: `${form.about}\n\nInstagram: ${form.instagram}\nPortfolio: ${form.portfolio_link}\nExperience: ${form.experience}`,
          price: "Application",
        }),
      });
      setDone(true);
    }
    setSaving(false);
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #E2D5C8",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    outline: "none",
    color: "#1A0E06",
    backgroundColor: "#FDFBF8",
    boxSizing: "border-box" as const,
    fontFamily: "'Jost', sans-serif",
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#7A5C44",
    display: "block",
    marginBottom: "8px",
    letterSpacing: "0.05em",
    fontFamily: "'Jost', sans-serif",
  };

  if (done) {
    return (
      <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>
        <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
          <Logo size="sm" />
        </nav>
        <div style={{maxWidth: "600px", margin: "0 auto", padding: "80px 32px", textAlign: "center"}}>
          <div style={{marginBottom: "24px"}}><ReviewStarIcon size={56} color="#C8622A"/></div>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("done.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px", letterSpacing: "-0.02em"}}>
            {t("done.heading", { name: form.name })}
          </h1>
          <p style={{fontSize: "15px", color: "#7A5C44", margin: "0 0 40px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            {t("done.description")}
          </p>
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "28px", border: "1px solid #E2D5C8", marginBottom: "40px", textAlign: "left"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("done.whatHappensNext")}</p>
            {[
              t("done.step1"),
              t("done.step2"),
              t("done.step3"),
              t("done.step4"),
            ].map((step, i) => (
              <div key={i} style={{display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: i < 3 ? "14px" : "0"}}>
                <span style={{fontSize: "11px", color: "#C8622A", flexShrink: 0, fontWeight: "500", fontFamily: "'Jost', sans-serif", paddingTop: "2px"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", lineHeight: "1.6"}}>{step}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px 40px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            {t("done.backToLomissa")}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("nav.backToHome")}</a>
      </nav>

      {/* Hero */}
      <section style={{backgroundColor: "#1A0E06", padding: "64px 48px", textAlign: "center"}}>
        <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("hero.badge")}</p>
        <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "400", color: "#FDFBF8", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.1"}}>
          {t("hero.heading")}
        </h1>
        <p style={{fontSize: "15px", color: "#DDD0C0", margin: "0 auto", maxWidth: "480px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
          {t("hero.description")}
        </p>
      </section>

      {/* Stats */}
      <section style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderBottom: "1px solid #E2D5C8"}}>
        <div style={{maxWidth: "680px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "64px", flexWrap: "wrap"}}>
          {[
            { valueKey: "stats.responseValue", labelKey: "stats.responseLabel" },
            { valueKey: "stats.commissionValue", labelKey: "stats.commissionLabel" },
            { valueKey: "stats.freeValue", labelKey: "stats.freeLabel" },
          ].map((stat) => (
            <div key={stat.valueKey} style={{textAlign: "center"}}>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0 0 4px", letterSpacing: "-0.02em"}}>{t(stat.valueKey as any)}</p>
              <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t(stat.labelKey as any)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <div style={{maxWidth: "680px", margin: "0 auto", padding: "48px 32px"}}>

        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", display: "flex", flexDirection: "column", gap: "24px"}}>

          <div>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("form.personalDetails")}</p>
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              <div>
                <label style={labelStyle}>{t("form.nameLabel")}</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder={t("form.namePlaceholder")} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>{t("form.emailLabel")}</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder={t("form.emailPlaceholder")} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>{t("form.phoneLabel")}</label>
                <input type="tel" value={form.phone_number} onChange={(e) => setForm({...form, phone_number: e.target.value})} placeholder={t("form.phonePlaceholder")} style={inputStyle}/>
                <p style={{fontSize: "11px", color: "#7A5C44", margin: "6px 0 0", fontFamily: "'Jost', sans-serif"}}>{t("form.phoneHelper")}</p>
              </div>
              <div>
                <label style={labelStyle}>{t("form.locationLabel")}</label>
                <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder={t("form.locationPlaceholder")} style={inputStyle}/>
              </div>
            </div>
          </div>

          <div style={{borderTop: "1px solid #E2D5C8", paddingTop: "24px"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("form.photographySection")}</p>
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              <div>
                <label style={labelStyle}>{t("form.categoriesLabel")}</label>
                <div style={{display: "flex", flexWrap: "wrap", gap: "8px"}}>
                  {CATEGORIES.map(cat => {
                    const sel = selectedCategories.includes(cat);
                    return (
                      <button key={cat} type="button"
                        onClick={() => {
                          const nowSelected = !sel;
                          setSelectedCategories(prev =>
                            nowSelected ? [...prev, cat] : prev.filter(c => c !== cat)
                          );
                          if (cat === "Other" && !nowSelected) setOtherSpecialty("");
                        }}
                        style={{padding: "7px 16px", borderRadius: "999px", border: `1px solid ${sel ? "#C8622A" : "#E2D5C8"}`, backgroundColor: sel ? "#C8622A" : "#FDFBF8", color: sel ? "#FDFBF8" : "#7A5C44", fontSize: "12px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: sel ? "500" : "400"}}
                      >{tCat(CATEGORY_KEY[cat])}</button>
                    );
                  })}
                </div>
                <p style={{fontSize: "11px", color: "#C8622A", margin: "8px 0 0", fontFamily: "monospace"}}>
                  DEBUG: [{selectedCategories.join(", ")}] — includesOther: {String(selectedCategories.includes("Other"))}
                </p>
                {selectedCategories.includes("Other") && (
                  <div style={{marginTop: "12px"}}>
                    <label style={labelStyle}>{t("form.otherSpecialtyLabel")}</label>
                    <input
                      type="text"
                      value={otherSpecialty}
                      onChange={(e) => setOtherSpecialty(e.target.value)}
                      placeholder={t("form.otherSpecialtyPlaceholder")}
                      maxLength={80}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>{t("form.experienceLabel")}</label>
                <select value={form.experience} onChange={(e) => setForm({...form, experience: e.target.value})} style={inputStyle}>
                  <option value="">{t("form.experiencePlaceholder")}</option>
                  <option>{t("experience.lessThan1")}</option>
                  <option>{t("experience.oneToTwo")}</option>
                  <option>{t("experience.threeToFive")}</option>
                  <option>{t("experience.fiveToTen")}</option>
                  <option>{t("experience.moreThan10")}</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t("form.instagramLabel")}</label>
                <div style={{display: "flex", alignItems: "center", border: "1px solid #E2D5C8", borderRadius: "8px", overflow: "hidden"}}>
                  <span style={{padding: "12px 16px", backgroundColor: "#F5EFE4", color: "#C8622A", fontSize: "13px", borderRight: "1px solid #E2D5C8", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>@</span>
                  <input type="text" value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 16px", fontSize: "13px", color: "#1A0E06", backgroundColor: "#FDFBF8", fontFamily: "'Jost', sans-serif"}}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t("form.portfolioLabel")}</label>
                <input type="text" value={form.portfolio_link} onChange={(e) => setForm({...form, portfolio_link: e.target.value})} placeholder={t("form.portfolioPlaceholder")} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>{t("form.websiteLabel")}</label>
                <input type="text" value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder={t("form.websitePlaceholder")} style={inputStyle}/>
              </div>
            </div>
          </div>

          <div style={{borderTop: "1px solid #E2D5C8", paddingTop: "24px"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("form.aboutSection")}</p>
            <div>
              <label style={labelStyle}>{t("form.aboutLabel")}</label>
              <textarea
                value={form.about}
                onChange={(e) => setForm({...form, about: e.target.value})}
                placeholder={t("form.aboutPlaceholder")}
                maxLength={500}
                rows={6}
                style={{...inputStyle, resize: "none"}}
              />
              <p style={{fontSize: "11px", color: form.about.length > 450 ? "#C8622A" : "#DDD0C0", margin: "6px 0 0", textAlign: "right", fontFamily: "'Jost', sans-serif"}}>{form.about.length}/500</p>
            </div>
          </div>

          {error && (
            <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca"}}>
              <p style={{fontSize: "13px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "16px", border: "none", borderRadius: "999px", cursor: saving ? "default" : "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", opacity: saving ? 0.7 : 1}}
          >
            {saving ? t("form.submitting") : t("form.submit")}
          </button>

          <p style={{fontSize: "12px", color: "#DDD0C0", textAlign: "center", margin: "0", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>
            {t("form.tosText")}
          </p>

        </div>
      </div>

      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}
