"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://lomissa.com/update-password",
    });
    if (error) { setError("Something went wrong. Please try again."); }
    else { setSent(true); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/login" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>← Back to login</a>
      </nav>

      <div style={{maxWidth: "480px", margin: "80px auto", padding: "0 32px"}}>
        {sent ? (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "48px 32px", border: "1px solid #E2D5C8", textAlign: "center"}}>
            <div style={{marginBottom: "24px"}}>
              <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
                <g stroke="#C8622A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="16" width="48" height="32" rx="4"/>
                  <polyline points="8,20 32,36 56,20"/>
                </g>
              </svg>
            </div>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>CHECK YOUR EMAIL</p>
            <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px", letterSpacing: "-0.02em"}}>
              Reset link sent
            </h1>
            <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
              We sent a password reset link to <strong style={{fontWeight: "500", color: "#1A0E06"}}>{email}</strong>. Check your inbox and click the link to reset your password.
            </p>
            <a href="/login" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
              Back to login
            </a>
          </div>
        ) : (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "48px 32px", border: "1px solid #E2D5C8"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ACCOUNT RECOVERY</p>
            <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
              Forgot your password?
            </h1>
            <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
              Enter your email address and we will send you a link to reset your password.
            </p>

            <div style={{marginBottom: "24px"}}>
              <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "8px", letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif"}}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                placeholder="your@email.com"
                style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
              />
            </div>

            {error && (
              <div style={{marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca"}}>
                <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={loading}
              style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: loading ? "default" : "pointer", fontWeight: "500", marginBottom: "16px", fontFamily: "'Jost', sans-serif", opacity: loading ? 0.7 : 1}}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <p style={{fontSize: "13px", color: "#7A5C44", textAlign: "center", margin: "0", fontFamily: "'Jost', sans-serif"}}>
              Remember your password?{" "}
              <a href="/login" style={{color: "#C8622A", textDecoration: "none"}}>Log in</a>
            </p>
          </div>
        )}
      </div>

      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}
