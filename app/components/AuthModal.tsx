"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useTranslations } from "../../lib/i18n";

type Step = "email" | "login" | "signup";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const t = useTranslations("AuthModal");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [tosChecked, setTosChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep("email");
      setEmail("");
      setPassword("");
      setName("");
      setTosChecked(false);
      setError("");
      setCheckEmail(false);
      setShowPassword(false);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const redirectByRole = (role?: string) => {
    if (role === "pending_photographer") window.location.href = "/pending";
    else if (role === "photographer") window.location.href = "/photographer-dashboard";
    else if (role === "admin") window.location.href = "/admin";
    else window.location.href = "/dashboard";
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError(t("errors.emailRequired")); return; }
    setLoading(true);
    setError("");

    // Probe whether the email exists by attempting sign-in with a dummy password.
    // "Invalid login credentials" / "Email not confirmed" → user exists → login step.
    // Any other error (user_not_found, etc.) → new user → signup step.
    const { error: probeErr } = await supabase.auth.signInWithPassword({
      email,
      password: `chk_${Date.now()}_${Math.random()}`,
    });

    setLoading(false);

    if (!probeErr) {
      // Astronomically unlikely with a random password, but handle gracefully.
      const { data: { session } } = await supabase.auth.getSession();
      redirectByRole(session?.user?.user_metadata?.role);
      return;
    }

    const msg = probeErr.message.toLowerCase();
    if (msg.includes("invalid login credentials") || msg.includes("email not confirmed")) {
      setStep("login");
    } else {
      setStep("signup");
    }
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError(t("errors.passwordRequired")); return; }
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(t("errors.invalidCredentials"));
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    redirectByRole(session?.user?.user_metadata?.role);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { setError(t("errors.nameRequired")); return; }
    if (!password || password.length < 8) { setError(t("errors.passwordLength")); return; }
    if (!tosChecked) { setError(t("errors.tosRequired")); return; }
    setLoading(true);
    setError("");

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: "client" } },
    });

    if (err) {
      setError(t("errors.genericError"));
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = "/dashboard";
    } else {
      setCheckEmail(true);
    }
    setLoading(false);
  };

  const goBack = () => {
    setStep("email");
    setPassword("");
    setName("");
    setTosChecked(false);
    setError("");
    setShowPassword(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  // ─── shared styles ───────────────────────────────────────────────────────────

  const backdrop: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 1000,
    backgroundColor: "rgba(26,14,6,0.55)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  };

  const card: React.CSSProperties = {
    backgroundColor: "#FDFBF8", borderRadius: "16px",
    width: "100%", maxWidth: "420px",
    padding: "40px 36px 32px",
    position: "relative",
    boxShadow: "0 24px 80px rgba(26,14,6,0.18)",
  };

  const inputCss: React.CSSProperties = {
    width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px",
    padding: "11px 14px", fontSize: "14px", fontFamily: "'Jost', sans-serif",
    color: "#1A0E06", backgroundColor: "#FDFBF8", outline: "none",
    boxSizing: "border-box",
  };

  const labelCss: React.CSSProperties = {
    display: "block", fontSize: "11px", color: "#7A5C44",
    fontFamily: "'Jost', sans-serif", fontWeight: "500",
    letterSpacing: "0.1em", marginBottom: "6px",
  };

  const submitBtn = (disabled: boolean): React.CSSProperties => ({
    backgroundColor: "#C8622A", color: "#FDFBF8", border: "none",
    borderRadius: "999px", padding: "13px 20px", fontSize: "14px",
    fontFamily: "'Jost', sans-serif", fontWeight: "500",
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing: "0.05em", opacity: disabled ? 0.7 : 1, marginTop: "4px",
    width: "100%",
  });

  const errorLine = (msg: string) => (
    <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif", margin: "0"}}>{msg}</p>
  );

  const closeBtn = (
    <button onClick={onClose} style={{position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#7A5C44", fontSize: "22px", lineHeight: 1, padding: "4px"}}>×</button>
  );

  const heading = (text: string) => (
    <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "30px", fontWeight: "400", color: "#1A0E06", margin: "0 0 24px", letterSpacing: "-0.01em"}}>{text}</h2>
  );

  const googleBtn = (
    <button type="button" onClick={handleGoogle} style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "12px 20px", backgroundColor: "#fff", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "14px", fontWeight: "500", color: "#1A0E06", marginBottom: "20px"}}>
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
      {t("googleLogin")}
    </button>
  );

  const divider = (
    <div style={{display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px"}}>
      <div style={{flex: 1, height: "1px", backgroundColor: "#E2D5C8"}}/>
      <span style={{fontSize: "12px", color: "#C4907A", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em"}}>{t("divider")}</span>
      <div style={{flex: 1, height: "1px", backgroundColor: "#E2D5C8"}}/>
    </div>
  );

  const emailPill = (
    <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", padding: "10px 14px", backgroundColor: "#F5EFE4", borderRadius: "8px", border: "0.5px solid #E2D5C8"}}>
      <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{email}</span>
      <button type="button" onClick={goBack} style={{background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#C8622A", fontFamily: "'Jost', sans-serif", fontWeight: "500", padding: "0", flexShrink: 0, letterSpacing: "0.02em"}}>
        {t("step2.change")}
      </button>
    </div>
  );

  const passwordField = (autocomplete: string) => (
    <div style={{position: "relative"}}>
      <input
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        ref={step === "login" ? inputRef : undefined}
        style={{...inputCss, paddingRight: "48px"}}
        autoComplete={autocomplete}
      />
      <button type="button" onClick={() => setShowPassword(v => !v)} style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em", padding: "4px"}}>
        {showPassword ? t("hide") : t("show")}
      </button>
    </div>
  );

  // ─── check-email confirmation screen ─────────────────────────────────────────

  if (checkEmail) {
    return (
      <div style={backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={card}>
          {closeBtn}
          <div style={{textAlign: "center", padding: "16px 0"}}>
            <div style={{width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#FBF0EA", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#C8622A"/></svg>
            </div>
            <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: "400", color: "#1A0E06", margin: "0 0 12px", letterSpacing: "-0.01em"}}>{t("checkEmail.heading")}</h2>
            <p style={{fontSize: "14px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", fontWeight: "300", lineHeight: "1.7", margin: "0 0 24px"}}>{t("checkEmail.description").replace("{email}", email)}</p>
            <button onClick={onClose} style={{backgroundColor: "#C8622A", color: "#FDFBF8", border: "none", borderRadius: "999px", padding: "12px 28px", fontSize: "13px", fontFamily: "'Jost', sans-serif", fontWeight: "500", cursor: "pointer", letterSpacing: "0.05em"}}>
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── main modal ──────────────────────────────────────────────────────────────

  return (
    <div style={backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={card}>
        {closeBtn}

        {/* ── STEP 1: EMAIL ── */}
        {step === "email" && (
          <>
            {heading(t("heading"))}
            {googleBtn}
            {divider}
            <form onSubmit={handleEmailContinue} style={{display: "flex", flexDirection: "column", gap: "14px"}}>
              <div>
                <label style={labelCss}>{t("emailLabel")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  ref={inputRef}
                  style={inputCss}
                  autoComplete="email"
                />
              </div>
              {error && errorLine(error)}
              <button type="submit" disabled={loading} style={submitBtn(loading)}>
                {loading ? t("step1.continuing") : t("step1.continue")}
              </button>
            </form>
            <p style={{fontSize: "12px", color: "#C4907A", fontFamily: "'Jost', sans-serif", textAlign: "center", margin: "16px 0 0"}}>
              {t("joinAsPhotographer")}{" "}<a href="/signup?role=photographer" style={{color: "#C8622A", textDecoration: "none", fontWeight: "500"}}>{t("applyHere")}</a>
            </p>
          </>
        )}

        {/* ── STEP 2A: LOGIN ── */}
        {step === "login" && (
          <>
            {heading(t("step2.loginHeading"))}
            {emailPill}
            <form onSubmit={handleLogin} style={{display: "flex", flexDirection: "column", gap: "14px"}}>
              <div>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px"}}>
                  <label style={labelCss}>{t("passwordLabel")}</label>
                  <a href="/reset-password" onClick={onClose} style={{fontSize: "11px", color: "#C8622A", fontFamily: "'Jost', sans-serif", textDecoration: "none"}}>{t("forgotPassword")}</a>
                </div>
                {passwordField("current-password")}
              </div>
              {error && errorLine(error)}
              <button type="submit" disabled={loading} style={submitBtn(loading)}>
                {loading ? t("step2.loginSubmitting") : t("step2.loginSubmit")}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2B: SIGNUP ── */}
        {step === "signup" && (
          <>
            {heading(t("step2.signupHeading"))}
            {emailPill}
            <form onSubmit={handleSignup} style={{display: "flex", flexDirection: "column", gap: "14px"}}>
              <div>
                <label style={labelCss}>{t("nameLabel")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  ref={inputRef}
                  placeholder={t("namePlaceholder")}
                  style={inputCss}
                  autoComplete="name"
                />
              </div>
              <div>
                <label style={labelCss}>{t("passwordLabel")}</label>
                {passwordField("new-password")}
              </div>
              <label style={{display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer"}}>
                <input
                  type="checkbox"
                  checked={tosChecked}
                  onChange={(e) => setTosChecked(e.target.checked)}
                  style={{marginTop: "3px", accentColor: "#C8622A", flexShrink: 0, width: "14px", height: "14px"}}
                />
                <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", lineHeight: "1.6", fontWeight: "300"}}>
                  {t("step2.tosText")}{" "}
                  <a href="/terms" target="_blank" style={{color: "#C8622A", textDecoration: "none"}}>{t("step2.tosTerms")}</a>
                  {" "}{t("step2.tosAnd")}{" "}
                  <a href="/privacy" target="_blank" style={{color: "#C8622A", textDecoration: "none"}}>{t("step2.tosPrivacy")}</a>
                </span>
              </label>
              {error && errorLine(error)}
              <button type="submit" disabled={loading} style={submitBtn(loading)}>
                {loading ? t("step2.signupSubmitting") : t("step2.signupSubmit")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
