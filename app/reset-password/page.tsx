"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

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
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
        </div>
        <a href="/login" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Back to login</a>
      </nav>

      <div style={{maxWidth: "480px", margin: "80px auto", padding: "0 32px"}}>
        {sent ? (
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "48px 32px", border: "1px solid #f0f0f0", textAlign: "center"}}>
            <div style={{fontSize: "48px", marginBottom: "24px"}}>📧</div>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>CHECK YOUR EMAIL</p>
            <h1 style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px", letterSpacing: "-0.5px"}}>
              Reset link sent!
            </h1>
            <p style={{fontSize: "14px", color: "#888", margin: "0 0 32px", lineHeight: "1.7"}}>
              We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to reset your password.
            </p>
            <a href="/login" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "8px", textDecoration: "none", display: "inline-block"}}>
              Back to login
            </a>
          </div>
        ) : (
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "48px 32px", border: "1px solid #f0f0f0"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>ACCOUNT RECOVERY</p>
            <h1 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
              Forgot your password?
            </h1>
            <p style={{fontSize: "14px", color: "#888", margin: "0 0 32px", lineHeight: "1.7"}}>
              Enter your email address and we will send you a link to reset your password.
            </p>

            <div style={{marginBottom: "24px"}}>
              <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                placeholder="your@email.com"
                style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", boxSizing: "border-box"}}
              />
            </div>

            {error && (
              <div style={{marginBottom: "16px", padding: "12px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
                <p style={{fontSize: "12px", color: "#cc0000", margin: "0"}}>{error}</p>
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={loading}
              style={{width: "100%", backgroundColor: "#C4907A", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginBottom: "16px"}}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <p style={{fontSize: "12px", color: "#888", textAlign: "center", margin: "0"}}>
              Remember your password?{" "}
              <a href="/login" style={{color: "#C4907A", textDecoration: "none"}}>Log in</a>
            </p>
          </div>
        )}
      </div>

      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0"}}>Lomissa</p>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}