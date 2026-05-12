"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import { ReviewStarIcon } from "../components/Icons";
import GlobeModal from "../components/GlobeModal";
import { useTranslations } from "next-intl";

export default function Signup() {
  const [role, setRole] = useState("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const t = useTranslations("Signup");

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [about, setAbout] = useState("");

  const handleClientSignup = async () => {
    if (!name || !email || !password) { setError(t("errors.fillAll")); return; }
    if (password.length < 8) { setError(t("errors.passwordLength")); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "client", name },
        emailRedirectTo: "https://lomissa.com/auth/confirm",
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  };

  const handlePhotographerApply = async () => {
    if (!name || !email || !password || !specialty || !about) {
      setError(t("errors.fillRequired"));
      return;
    }
    if (password.length < 8) {
      setError(t("errors.passwordLength"));
      return;
    }
    setLoading(true);
    setError("");

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "pending_photographer", name },
        emailRedirectTo: "https://lomissa.com/auth/confirm",
      },
    });

    if (signupError) { setError(signupError.message); setLoading(false); return; }

    const { error: appError } = await supabase.from("applications").insert({
      name, email, location, specialty, experience,
      instagram, portfolio_link: portfolio, about, status: "pending",
    });

    if (appError) { setError("Something went wrong. Please try again."); setLoading(false); return; }

    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photographerName: "Lomissa Team",
        photographerEmail: "hello@lomissa.com",
        clientName: name,
        clientEmail: "hello@lomissa.com",
        type: "photographer_application",
        date: new Date().toLocaleDateString(),
        location,
        message: `${about}\n\nInstagram: ${instagram}\nPortfolio: ${portfolio}\nExperience: ${experience}`,
        price: "Application",
      }),
    });

    setDone(true);
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #E2D5C8",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    color: "#1A0E06",
    backgroundColor: "#FDFBF8",
    boxSizing: "border-box",
    fontFamily: "'Jost', sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#7A5C44",
    display: "block",
    marginBottom: "6px",
    fontFamily: "'Jost', sans-serif",
    letterSpacing: "0.05em",
  };

  if (done && role === "client") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "16px", padding: "48px 32px", border: "1px solid #E2D5C8", textAlign: "center", maxWidth: "480px"}}>
          <div style={{marginBottom: "24px"}}><ReviewStarIcon size={56} color="#C8622A"/></div>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("doneClient.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px"}}>{t("doneClient.heading")}</h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            {t("doneClient.description")}
          </p>
          <a href="/login" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            {t("doneClient.cta")}
          </a>
        </div>
      </main>
    );
  }

  if (done && role === "photographer") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "16px", padding: "48px 32px", border: "1px solid #E2D5C8", textAlign: "center", maxWidth: "480px"}}>
          <div style={{marginBottom: "24px"}}><ReviewStarIcon size={56} color="#C8622A"/></div>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("donePhotographer.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px"}}>{t("donePhotographer.heading", { name })}</h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 24px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            {t("donePhotographer.description")}
          </p>
          <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "16px", marginBottom: "24px", textAlign: "left"}}>
            {([
              t("donePhotographer.step1"),
              t("donePhotographer.step2"),
              t("donePhotographer.step3"),
              t("donePhotographer.step4"),
            ]).map((step, i) => (
              <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 3 ? "10px" : "0"}}>
                <span style={{fontSize: "12px", color: "#C8622A", flexShrink: 0, fontWeight: "600", fontFamily: "'Jost', sans-serif"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{step}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            {t("donePhotographer.backToLomissa")}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex" style={{backgroundColor: "#FDFBF8", position: "relative"}}>
      <div style={{position: "absolute", top: "16px", right: "24px", zIndex: 10}}><GlobeModal /></div>

      {/* Left — dark panel */}
      <div className="hidden md:flex flex-col justify-between" style={{width: "45%", backgroundColor: "#1A0E06", padding: "48px", flexShrink: 0}}>
        <Logo size="sm" href="/" color="#FDFBF8" accent="#C1622F" />
        <div>
          {role === "client" ? (
            <>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#FDFBF8", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.2"}}>
                {t("panel.clientHeadline")}
              </p>
              <p style={{fontSize: "14px", color: "rgba(253,251,248,0.5)", margin: "0", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
                {t("panel.clientDesc")}
              </p>
            </>
          ) : (
            <>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#FDFBF8", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.2"}}>
                {t("panel.photographerHeadline")}
              </p>
              <p style={{fontSize: "14px", color: "rgba(253,251,248,0.5)", margin: "0 0 32px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
                {t("panel.photographerDesc")}
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {[
                  { valueKey: "panel.statFree", labelKey: "panel.statFreeLabel" },
                  { valueKey: "panel.statCommission", labelKey: "panel.statCommissionLabel" },
                  { valueKey: "panel.statResponse", labelKey: "panel.statResponseLabel" },
                ].map((stat) => (
                  <div key={stat.valueKey} style={{display: "flex", alignItems: "center", gap: "16px"}}>
                    <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", fontWeight: "500", color: "#C1622F", margin: "0", minWidth: "60px"}}>{t(stat.valueKey as any)}</p>
                    <p style={{fontSize: "13px", color: "rgba(253,251,248,0.4)", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t(stat.labelKey as any)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <p style={{fontSize: "12px", color: "rgba(253,251,248,0.3)", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1" style={{padding: "48px 32px", maxWidth: "600px", margin: "0 auto", overflowY: "auto"}}>

        <div style={{marginBottom: "32px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("form.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {role === "client" ? t("form.headingClient") : t("form.headingPhotographer")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            {t("form.haveAccount")}{" "}
            <a href="/login" style={{color: "#C8622A", textDecoration: "none", fontWeight: "500"}}>{t("form.logIn")}</a>
          </p>
        </div>

        {/* Role selector */}
        <div style={{display: "flex", gap: "8px", marginBottom: "32px", backgroundColor: "#F5EFE4", padding: "4px", borderRadius: "999px"}}>
          <button
            onClick={() => { setRole("client"); setError(""); }}
            style={{flex: 1, padding: "10px", border: "none", borderRadius: "999px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "client" ? "#C8622A" : "transparent", color: role === "client" ? "#FDFBF8" : "#7A5C44", fontWeight: "500", transition: "all 0.2s", fontFamily: "'Jost', sans-serif"}}
          >
            {t("form.roleBook")}
          </button>
          <button
            onClick={() => { setRole("photographer"); setError(""); }}
            style={{flex: 1, padding: "10px", border: "none", borderRadius: "999px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "photographer" ? "#C8622A" : "transparent", color: role === "photographer" ? "#FDFBF8" : "#7A5C44", fontWeight: "500", transition: "all 0.2s", fontFamily: "'Jost', sans-serif"}}
          >
            {t("form.rolePhotographer")}
          </button>
        </div>

        {/* Client form */}
        {role === "client" && (
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#7A5C44", padding: "0", fontFamily: "'Jost', sans-serif"}}>
                  {showPassword ? t("form.hide") : t("form.show")}
                </button>
              </div>
            </div>
            {error && (
              <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
              </div>
            )}
            <button onClick={handleClientSignup} disabled={loading} style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginTop: "8px", fontFamily: "'Jost', sans-serif", boxShadow: "0 4px 20px rgba(184,85,40,0.3)"}}>
              {loading ? t("form.submittingClient") : t("form.submitClient")}
            </button>
            <p style={{fontSize: "11px", color: "#DDD0C0", textAlign: "center", margin: "0", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>
              {t("form.tosText")}{" "}
              <a href="/terms" style={{color: "#7A5C44", textDecoration: "none"}}>{t("form.tosTerms")}</a>
              {" "}{t("form.tosAnd")}{" "}
              <a href="/privacy" style={{color: "#7A5C44", textDecoration: "none"}}>{t("form.tosPrivacy")}</a>
            </p>
          </div>
        )}

        {/* Photographer application form */}
        {role === "photographer" && (
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>

            <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "12px 16px", border: "1px solid #E2D5C8"}}>
              <p style={{fontSize: "13px", color: "#C8622A", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                {t("form.photoReviewNote")}
              </p>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#7A5C44", padding: "0", fontFamily: "'Jost', sans-serif"}}>
                  {showPassword ? t("form.hide") : t("form.show")}
                </button>
              </div>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
              <div>
                <label style={labelStyle}>{t("form.locationLabel")}</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("form.locationPlaceholder")} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>{t("form.specialtyLabel")}</label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle}>
                  <option value="">{t("form.specialtyPlaceholder")}</option>
                  <option>{t("specialty.portraits")}</option>
                  <option>{t("specialty.weddings")}</option>
                  <option>{t("specialty.events")}</option>
                  <option>{t("specialty.travel")}</option>
                  <option>{t("specialty.fashion")}</option>
                  <option>{t("specialty.commercial")}</option>
                  <option>{t("specialty.street")}</option>
                  <option>{t("specialty.nature")}</option>
                </select>
              </div>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
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
              <div>
                <label style={labelStyle}>{t("form.instagramLabel")}</label>
                <div style={{display: "flex", alignItems: "center", border: "1px solid #E2D5C8", borderRadius: "8px", overflow: "hidden", backgroundColor: "#FDFBF8"}}>
                  <span style={{padding: "12px 12px", backgroundColor: "#F5EFE4", color: "#C8622A", fontSize: "13px", borderRight: "1px solid #E2D5C8", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>@</span>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 12px", fontSize: "14px", color: "#1A0E06", backgroundColor: "#FDFBF8", fontFamily: "'Jost', sans-serif"}}/>
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t("form.portfolioLabel")}</label>
              <input type="text" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder={t("form.portfolioPlaceholder")} style={inputStyle}/>
            </div>

            <div>
              <label style={labelStyle}>{t("form.aboutLabel")}</label>
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder={t("form.aboutPlaceholder")} rows={4} style={{...inputStyle, resize: "none"}}/>
              <p style={{fontSize: "11px", color: about.length > 450 ? "#C8622A" : "#DDD0C0", margin: "4px 0 0", textAlign: "right", fontFamily: "'Jost', sans-serif"}}>{about.length}/500</p>
            </div>

            {error && (
              <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
              </div>
            )}

            <button onClick={handlePhotographerApply} disabled={loading} style={{width: "100%", backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginTop: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
              {loading ? t("form.submittingPhotographer") : t("form.submitPhotographer")}
            </button>

            <p style={{fontSize: "11px", color: "#DDD0C0", textAlign: "center", margin: "0", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>
              {t("form.tosText")}{" "}
              <a href="/terms" style={{color: "#7A5C44", textDecoration: "none"}}>{t("form.tosTerms")}</a>
              {" "}{t("form.tosAnd")}{" "}
              <a href="/privacy" style={{color: "#7A5C44", textDecoration: "none"}}>{t("form.tosPrivacy")}</a>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </main>
  );
}
