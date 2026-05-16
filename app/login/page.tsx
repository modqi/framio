"use client";
import { useState, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import GlobeModal from "../components/GlobeModal";
import { useTranslations } from "../../lib/i18n";

const isDev = process.env.NODE_ENV === "development";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const t = useTranslations("Login");

  const handleLogin = async () => {
    if (!email || !password) { setError(t("errors.fillAll")); return; }
    if (!isDev && !turnstileToken) { setError(t("errors.securityCheck")); return; }
    setLoading(true);
    setError("");
    const verifyRes = await fetch("/api/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: turnstileToken }),
    });
    if (!verifyRes.ok) {
      setError(t("errors.securityCheck"));
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(t("errors.invalidCredentials")); setLoading(false); return; }
    const user = data.user;
    const role = user?.user_metadata?.role;
    if (role === "photographer") { window.location.href = "/photographer-dashboard"; }
    else if (role === "pending_photographer") { window.location.href = "/pending"; }
    else if (role === "admin") { window.location.href = "/admin"; }
    else {
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      window.location.href = (redirect && redirect.startsWith("/")) ? redirect : "/dashboard";
    }
    setLoading(false);
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

  return (
    <main style={{backgroundColor: "#FDFBF8", display: "flex", flexDirection: "column", minHeight: "100vh"}}>
      <style>{`
        @media (max-width: 767px) {
          .login-nav  { padding: 16px 20px !important; }
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left { display: none !important; }
          .login-right { padding: 28px 20px 48px !important; max-height: none !important; overflow-y: visible !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="login-nav" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 56px", borderBottom: "0.5px solid #E2D5C8", backgroundColor: "#FDFBF8"}}>
        <Logo size="sm" href="/" />
        <div style={{display: "flex", alignItems: "center", gap: "16px"}}>
          <GlobeModal />
        </div>
      </nav>

      {/* TWO COLUMN LAYOUT */}
      <div className="login-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1}}>

        {/* LEFT — motivation */}
        <div className="login-left" style={{padding: "72px 56px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "0.5px solid #E2D5C8", position: "sticky", top: "0", height: "calc(100vh - 65px)", overflow: "hidden"}}>
          <p style={{fontSize: "10px", fontWeight: "500", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C8622A", marginBottom: "20px", fontFamily: "'Jost', sans-serif"}}>
            {t("panel.badge")}
          </p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "52px", fontWeight: "300", fontStyle: "italic", color: "#1A0E06", lineHeight: "1.05", marginBottom: "20px"}}>
            {t("panel.headingBefore")}<br/><em style={{color: "#C8622A"}}>{t("panel.headingAccent")}</em>
          </h1>
          <p style={{fontSize: "14px", color: "#4A3020", fontWeight: "300", lineHeight: "1.9", marginBottom: "40px", maxWidth: "380px", fontFamily: "'Jost', sans-serif"}}>
            {t("panel.description")}
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
        </div>

        {/* RIGHT — form */}
        <div className="login-right" style={{padding: "72px 56px", overflowY: "auto", maxHeight: "calc(100vh - 65px)"}}>

          <div style={{marginBottom: "28px"}}>
            <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "300", fontStyle: "italic", color: "#1A0E06", marginBottom: "8px"}}>
              {t("form.heading")}
            </h1>
            <p style={{fontSize: "13px", color: "#7A5C44", fontWeight: "300", fontFamily: "'Jost', sans-serif"}}>
              {t("form.noAccount")}{" "}
              <a href="/signup" style={{color: "#C8622A", textDecoration: "none", fontWeight: "500"}}>{t("form.signUpFree")}</a>
            </p>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>

            {/* Email */}
            <div>
              <label style={labelStyle}>{t("form.emailLabel")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px"}}>
                <label style={{...labelStyle, marginBottom: 0}}>{t("form.passwordLabel")}</label>
                <a href="/reset-password" style={{fontSize: "11px", color: "#C8622A", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("form.forgotPassword")}</a>
              </div>
              <div style={{position: "relative"}}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{...inputStyle, paddingRight: "60px"}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}
                >
                  {showPassword ? t("form.hide") : t("form.show")}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "0.5px solid #E8A97E"}}>
                <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
              </div>
            )}

            {/* Turnstile */}
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => { setTurnstileToken(null); }}
              onExpire={() => { setTurnstileToken(null); }}
              options={{ size: "invisible" }}
            />

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginTop: "6px", fontFamily: "'Jost', sans-serif"}}
            >
              {loading ? t("form.submitting") : t("form.submit")}
            </button>

            {/* Divider */}
            <div style={{display: "flex", alignItems: "center", gap: "12px", margin: "4px 0"}}>
              <div style={{flex: 1, height: "0.5px", backgroundColor: "#E2D5C8"}} />
              <span style={{fontSize: "11px", color: "#DDD0C0", fontFamily: "'Jost', sans-serif"}}>{t("form.divider")}</span>
              <div style={{flex: 1, height: "0.5px", backgroundColor: "#E2D5C8"}} />
            </div>

            {/* Photographer box */}
            <div style={{border: "0.5px solid #E2D5C8", borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap"}}>
              <p style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", fontWeight: "300", margin: "0", flex: 1}}>
                {t("form.photographerBox")}
              </p>
              <a
                href="/signup"
                style={{fontSize: "12px", color: "#1A0E06", border: "0.5px solid #E2D5C8", padding: "8px 16px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", flexShrink: 0, whiteSpace: "nowrap"}}
              >
                {t("form.applyToJoin")} →
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
