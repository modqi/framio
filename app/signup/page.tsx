"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const isDev = process.env.NODE_ENV === "development";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import { ReviewStarIcon } from "../components/Icons";
import GlobeModal from "../components/GlobeModal";
import { useTranslations } from "../../lib/i18n";
import { CATEGORIES, CATEGORY_KEY } from "../../lib/categories";

export default function Signup() {
  const router = useRouter();
  const [role, setRole] = useState("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const t = useTranslations("Signup");
  const tCat = useTranslations("Categories");

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherSpecialty, setOtherSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [about, setAbout] = useState("");

  const verifyTurnstile = async (): Promise<boolean> => {
    if (!isDev && !turnstileToken) { setError(t("errors.securityCheck")); return false; }
    const res = await fetch("/api/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: turnstileToken }),
    });
    if (!res.ok) {
      setError(t("errors.securityCheck"));
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      return false;
    }
    return true;
  };

  const handleClientSignup = async () => {
    if (!name || !email || !password) { setError(t("errors.fillAll")); return; }
    if (password.length < 8) { setError(t("errors.passwordLength")); return; }
    setLoading(true); setError("");
    if (!await verifyTurnstile()) { setLoading(false); return; }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { role: "client", name }, emailRedirectTo: "https://lomissa.com/auth/confirm" },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true); setLoading(false);
  };

  const handlePhotographerApply = async () => {
    if (!name || !email || !password || selectedCategories.length === 0 || !about) {
      setError(t("errors.fillRequired")); return;
    }
    if (password.length < 8) { setError(t("errors.passwordLength")); return; }
    setLoading(true); setError("");
    if (!await verifyTurnstile()) { setLoading(false); return; }
    const { error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { role: "pending_photographer", name, specialties: selectedCategories }, emailRedirectTo: "https://lomissa.com/auth/confirm" },
    });
    if (signupError) { setError(signupError.message); setLoading(false); return; }
    const { error: appError } = await supabase.from("applications").insert({
      name, email, location,
      specialty: selectedCategories.join(", "),
      other_specialty: selectedCategories.includes("Other") ? otherSpecialty.trim() || null : null,
      experience, instagram, portfolio_link: portfolio, about, status: "pending",
    });
    if (appError) { setError("Something went wrong. Please try again."); setLoading(false); return; }
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photographerName: "Lomissa Team", photographerEmail: "hello@lomissa.com",
        clientName: name, clientEmail: "hello@lomissa.com",
        type: "photographer_application", date: new Date().toLocaleDateString(),
        location, message: `${about}\n\nInstagram: ${instagram}\nPortfolio: ${portfolio}\nExperience: ${experience}`,
        price: "Application",
      }),
    });
    setDone(true); setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "0.5px solid #E2D5C8", borderRadius: "10px",
    padding: "12px 16px", fontSize: "13px", outline: "none",
    color: "#1A0E06", backgroundColor: "#FDFBF8", boxSizing: "border-box",
    fontFamily: "'Jost', sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px", color: "#7A5C44", display: "block",
    marginBottom: "5px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em",
  };

  if (done && role === "client") {
    return (
      <main style={{minHeight: "100vh", backgroundColor: "#FDFBF8", display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "16px", padding: "48px 32px", border: "0.5px solid #E2D5C8", textAlign: "center", maxWidth: "480px"}}>
          <div style={{marginBottom: "24px"}}><ReviewStarIcon size={56} color="#C8622A"/></div>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("doneClient.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", fontStyle: "italic", color: "#1A0E06", margin: "0 0 16px"}}>{t("doneClient.heading")}</h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t("doneClient.description")}</p>
          <a href="/login" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("doneClient.cta")}</a>
        </div>
      </main>
    );
  }

  if (done && role === "photographer") {
    return (
      <main style={{minHeight: "100vh", backgroundColor: "#FDFBF8", display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "16px", padding: "48px 32px", border: "0.5px solid #E2D5C8", textAlign: "center", maxWidth: "480px"}}>
          <div style={{marginBottom: "24px"}}><ReviewStarIcon size={56} color="#C8622A"/></div>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("donePhotographer.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", fontStyle: "italic", color: "#1A0E06", margin: "0 0 16px"}}>{t("donePhotographer.heading", { name })}</h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 24px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t("donePhotographer.description")}</p>
          <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "16px", marginBottom: "24px", textAlign: "left"}}>
            {[t("donePhotographer.step1"), t("donePhotographer.step2"), t("donePhotographer.step3"), t("donePhotographer.step4")].map((step, i) => (
              <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 3 ? "10px" : "0"}}>
                <span style={{fontSize: "12px", color: "#C8622A", flexShrink: 0, fontWeight: "600", fontFamily: "'Jost', sans-serif"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{step}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("donePhotographer.backToLomissa")}</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{backgroundColor: "#FDFBF8", display: "flex", flexDirection: "column", minHeight: "100vh"}}>
      <style>{`
        @media (max-width: 767px) {
          .signup-nav  { padding: 16px 20px !important; }
          .signup-grid { grid-template-columns: 1fr !important; }
          .signup-left { display: none !important; }
          .signup-right { padding: 28px 20px 48px !important; max-height: none !important; overflow-y: visible !important; }
          .photo-inner-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="signup-nav" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 56px", borderBottom: "0.5px solid #E2D5C8", backgroundColor: "#FDFBF8"}}>
        <Logo size="sm" href="/" />
        <div style={{display: "flex", alignItems: "center", gap: "16px"}}>
          <GlobeModal />
        </div>
      </nav>

      {/* TWO COLUMN LAYOUT */}
      <div className="signup-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1}}>

        {/* LEFT — motivation */}
        <div className="signup-left" style={{padding: "72px 56px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "0.5px solid #E2D5C8", position: "sticky", top: "0", height: "calc(100vh - 65px)", overflow: "hidden"}}>

          {/* CLIENT LEFT */}
          {role === "client" && (
            <>
              <p style={{fontSize: "10px", fontWeight: "500", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C8622A", marginBottom: "20px", fontFamily: "'Jost', sans-serif"}}>
                {t("panel.clientBadge")}
              </p>
              <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "52px", fontWeight: "300", fontStyle: "italic", color: "#1A0E06", lineHeight: "1.05", marginBottom: "20px"}}>
                {t("panel.clientHeadlinePart1")}<br/><em style={{color: "#C8622A"}}>{t("panel.clientHeadlinePart2")}</em><br/>{t("panel.clientHeadlinePart3")}
              </h1>
              <p style={{fontSize: "14px", color: "#4A3020", fontWeight: "300", lineHeight: "1.9", marginBottom: "40px", maxWidth: "380px", fontFamily: "'Jost', sans-serif"}}>
                {t("panel.clientDesc")}
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
                {[
                  { title: t("panel.feature1Title"), desc: t("panel.feature1Desc") },
                  { title: t("panel.feature2Title"), desc: t("panel.feature2Desc") },
                  { title: t("panel.feature3Title"), desc: t("panel.feature3Desc") },
                ].map((f, i) => (
                  <div key={i} style={{display: "flex", alignItems: "flex-start", gap: "16px"}}>
                    <div style={{width: "6px", height: "6px", borderRadius: "50%", background: "#C8622A", flexShrink: 0, marginTop: "6px"}}></div>
                    <div>
                      <div style={{fontSize: "13px", fontWeight: "500", color: "#1A0E06", marginBottom: "2px", fontFamily: "'Jost', sans-serif"}}>{f.title}</div>
                      <div style={{fontSize: "12px", color: "#7A5C44", fontWeight: "300", lineHeight: "1.6", fontFamily: "'Jost', sans-serif"}}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PHOTOGRAPHER LEFT */}
          {role === "photographer" && (
            <>
              <p style={{fontSize: "10px", fontWeight: "500", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C8622A", marginBottom: "20px", fontFamily: "'Jost', sans-serif"}}>
                {t("panel.photographerBadge")}
              </p>
              <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "52px", fontWeight: "300", fontStyle: "italic", color: "#1A0E06", lineHeight: "1.05", marginBottom: "20px"}}>
                {t("panel.photographerHeadlinePart1")}<br/><em style={{color: "#C8622A"}}>{t("panel.photographerHeadlinePart2")}</em>
              </h1>
              <p style={{fontSize: "14px", color: "#4A3020", fontWeight: "300", lineHeight: "1.9", marginBottom: "40px", maxWidth: "380px", fontFamily: "'Jost', sans-serif"}}>
                {t("panel.photographerDesc")}
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px"}}>
                {[
                  { value: t("panel.statFree"), label: t("panel.statFreeLabel") },
                  { value: t("panel.statCommission"), label: t("panel.statCommissionLabel") },
                  { value: t("panel.statResponse"), label: t("panel.statResponseLabel") },
                ].map((s, i) => (
                  <div key={i} style={{display: "flex", alignItems: "center", gap: "20px"}}>
                    <div style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "300", color: "#C8622A", lineHeight: "1", minWidth: "70px"}}>{s.value}</div>
                    <div style={{width: "0.5px", height: "36px", background: "#E2D5C8", flexShrink: 0}}></div>
                    <div style={{fontSize: "12px", color: "#7A5C44", fontWeight: "300", fontFamily: "'Jost', sans-serif"}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>

        {/* RIGHT — form */}
        <div className="signup-right" style={{padding: "72px 56px", overflowY: "auto", maxHeight: "calc(100vh - 65px)"}}>

          <div style={{marginBottom: "28px"}}>
            <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "300", fontStyle: "italic", color: "#1A0E06", marginBottom: "8px"}}>
              {role === "client" ? t("form.headingClient") : t("form.headingPhotographer")}
            </h1>
            <p style={{fontSize: "13px", color: "#7A5C44", fontWeight: "300", fontFamily: "'Jost', sans-serif"}}>
              {t("form.haveAccount")}{" "}
              <a href="/login" style={{color: "#C8622A", textDecoration: "none", fontWeight: "500"}}>{t("form.logIn")}</a>
            </p>
          </div>

          {/* Turnstile — invisible, shared by both client and photographer submit handlers */}
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => { setTurnstileToken(null); }}
            onExpire={() => { setTurnstileToken(null); }}
            options={{ size: "invisible" }}
          />

          {/* TOGGLE */}
          <div style={{display: "flex", gap: "6px", backgroundColor: "#F0EAE0", padding: "4px", borderRadius: "999px", marginBottom: "28px"}}>
            <button
              onClick={() => { setRole("client"); setError(""); }}
              style={{flex: 1, padding: "11px 20px", border: "none", borderRadius: "999px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "client" ? "#C8622A" : "transparent", color: role === "client" ? "#FDFBF8" : "#1A0E06", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}
            >{t("form.roleBook")}</button>
            <button
              onClick={() => { setRole("photographer"); setError(""); }}
              style={{flex: 1, padding: "11px 20px", border: "none", borderRadius: "999px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "photographer" ? "#C8622A" : "transparent", color: role === "photographer" ? "#FDFBF8" : "#1A0E06", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}
            >{t("form.rolePhotographer")}</button>
          </div>

          {/* CLIENT FORM */}
          {role === "client" && (
            <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>
              <div>
                <label style={labelStyle}>{t("form.nameLabel")}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("form.namePlaceholder")} onKeyDown={(e) => e.key === "Enter" && handleClientSignup()} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>{t("form.emailLabel")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={(e) => e.key === "Enter" && handleClientSignup()} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>{t("form.passwordLabel")}</label>
                <div style={{position: "relative"}}>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("form.passwordPlaceholder")} onKeyDown={(e) => e.key === "Enter" && handleClientSignup()} style={{...inputStyle, paddingRight: "60px"}}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
                    {showPassword ? t("form.hide") : t("form.show")}
                  </button>
                </div>
              </div>
              {error && (
                <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "0.5px solid #E8A97E"}}>
                  <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
                </div>
              )}
              <button onClick={handleClientSignup} disabled={loading} style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginTop: "6px", fontFamily: "'Jost', sans-serif"}}>
                {loading ? t("form.submittingClient") : t("form.submitClient")}
              </button>
              <p style={{fontSize: "11px", color: "#DDD0C0", textAlign: "center", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>
                {t("form.tosText")}{" "}
                <a href="/terms" style={{color: "#7A5C44", textDecoration: "none"}}>{t("form.tosTerms")}</a>
                {" "}{t("form.tosAnd")}{" "}
                <a href="/privacy" style={{color: "#7A5C44", textDecoration: "none"}}>{t("form.tosPrivacy")}</a>
              </p>
            </div>
          )}

          {/* PHOTOGRAPHER FORM */}
          {role === "photographer" && (
            <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>
              <div style={{backgroundColor: "#F5EFE4", borderRadius: "10px", padding: "11px 14px", border: "0.5px solid #E2D5C8"}}>
                <p style={{fontSize: "12px", color: "#C8622A", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("form.photoReviewNote")}</p>
              </div>
              <div className="photo-inner-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px"}}>
                <div>
                  <label style={labelStyle}>{t("form.nameLabelRequired")}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("form.namePlaceholder")} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("form.emailLabelRequired")}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t("form.passwordLabelRequired")}</label>
                <div style={{position: "relative"}}>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("form.passwordPlaceholder")} style={{...inputStyle, paddingRight: "60px"}}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
                    {showPassword ? t("form.hide") : t("form.show")}
                  </button>
                </div>
              </div>
              <div className="photo-inner-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px"}}>
                <div>
                  <label style={labelStyle}>{t("form.locationLabel")}</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("form.locationPlaceholder")} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("form.experienceLabel")}</label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} style={inputStyle}>
                    <option value="">{t("form.experiencePlaceholder")}</option>
                    <option>{t("experience.lessThan1")}</option>
                    <option>{t("experience.oneToTwo")}</option>
                    <option>{t("experience.threeToFive")}</option>
                    <option>{t("experience.fiveToTen")}</option>
                    <option>{t("experience.moreThan10")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t("form.categoriesLabel")}</label>
                <div style={{display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px"}}>
                  {CATEGORIES.map(cat => {
                    const sel = selectedCategories.includes(cat);
                    return (
                      <button key={cat} type="button"
                        onClick={() => {
                          const nowSelected = !sel;
                          setSelectedCategories(prev => nowSelected ? [...prev, cat] : prev.filter(c => c !== cat));
                          if (cat === "Other" && !nowSelected) setOtherSpecialty("");
                        }}
                        style={{padding: "5px 12px", borderRadius: "999px", border: `0.5px solid ${sel ? "#C8622A" : "#E2D5C8"}`, backgroundColor: sel ? "#C8622A" : "#FDFBF8", color: sel ? "#FDFBF8" : "#7A5C44", fontSize: "11px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: sel ? "500" : "400"}}
                      >{tCat(CATEGORY_KEY[cat])}</button>
                    );
                  })}
                </div>
                {selectedCategories.includes("Other") && (
                  <div style={{marginTop: "10px"}}>
                    <label style={labelStyle}>{t("form.otherSpecialtyLabel")}</label>
                    <input type="text" value={otherSpecialty} onChange={(e) => setOtherSpecialty(e.target.value)} placeholder={t("form.otherSpecialtyPlaceholder")} maxLength={80} style={inputStyle}/>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>{t("form.instagramLabel")}</label>
                <div style={{display: "flex", alignItems: "center", border: "0.5px solid #E2D5C8", borderRadius: "10px", overflow: "hidden", backgroundColor: "#FDFBF8"}}>
                  <span style={{padding: "12px 12px", backgroundColor: "#F5EFE4", color: "#C8622A", fontSize: "13px", borderRight: "0.5px solid #E2D5C8", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>@</span>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 12px", fontSize: "13px", color: "#1A0E06", backgroundColor: "#FDFBF8", fontFamily: "'Jost', sans-serif"}}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t("form.portfolioLabel")}</label>
                <input type="text" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder={t("form.portfolioPlaceholder")} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>{t("form.aboutLabel")}</label>
                <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder={t("form.aboutPlaceholder")} rows={4} style={{...inputStyle, resize: "none"}}/>
                <p style={{fontSize: "11px", color: about.length > 450 ? "#C8622A" : "#DDD0C0", margin: "3px 0 0", textAlign: "right", fontFamily: "'Jost', sans-serif"}}>{about.length}/500</p>
              </div>
              {error && (
                <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "0.5px solid #E8A97E"}}>
                  <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
                </div>
              )}
              <button onClick={handlePhotographerApply} disabled={loading} style={{width: "100%", backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginTop: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.04em"}}>
                {loading ? t("form.submittingPhotographer") : t("form.submitPhotographer")}
              </button>
              <p style={{fontSize: "11px", color: "#DDD0C0", textAlign: "center", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>
                {t("form.tosText")}{" "}
                <a href="/terms" style={{color: "#7A5C44", textDecoration: "none"}}>{t("form.tosTerms")}</a>
                {" "}{t("form.tosAnd")}{" "}
                <a href="/privacy" style={{color: "#7A5C44", textDecoration: "none"}}>{t("form.tosPrivacy")}</a>
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}