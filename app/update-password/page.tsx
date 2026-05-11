"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import GlobeModal from "../components/GlobeModal";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdate = async () => {
    if (!password) { setError("Please enter a new password."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError("Something went wrong. Please try again."); }
    else { setDone(true); }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #E2D5C8",
    borderRadius: "8px",
    padding: "12px 16px",
    paddingRight: "60px",
    fontSize: "13px",
    outline: "none",
    color: "#1A0E06",
    backgroundColor: "#FDFBF8",
    boxSizing: "border-box" as const,
    fontFamily: "'Jost', sans-serif",
  };

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <GlobeModal />
      </nav>

      <div style={{maxWidth: "480px", margin: "80px auto", padding: "0 32px"}}>
        {done ? (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "48px 32px", border: "1px solid #E2D5C8", textAlign: "center"}}>
            <div style={{marginBottom: "24px"}}>
              <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
                <circle cx="32" cy="32" r="28" stroke="#C8622A" strokeWidth="1.6"/>
                <polyline points="18,32 27,41 46,22" stroke="#C8622A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px", letterSpacing: "-0.02em"}}>
              Password updated
            </h1>
            <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <a href="/login" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
              Log in
            </a>
          </div>
        ) : (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "48px 32px", border: "1px solid #E2D5C8"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ACCOUNT RECOVERY</p>
            <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
              Set new password
            </h1>
            <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
              Choose a strong password for your Lomissa account.
            </p>

            <div style={{marginBottom: "16px"}}>
              <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "8px", letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif"}}>New password</label>
              <div style={{position: "relative"}}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#7A5C44", padding: "0", fontFamily: "'Jost', sans-serif"}}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div style={{marginBottom: "24px"}}>
              <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "8px", letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif"}}>Confirm password</label>
              <div style={{position: "relative"}}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#7A5C44", padding: "0", fontFamily: "'Jost', sans-serif"}}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca"}}>
                <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
              </div>
            )}

            <button
              onClick={handleUpdate}
              disabled={loading}
              style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: loading ? "default" : "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", opacity: loading ? 0.7 : 1}}
            >
              {loading ? "Updating…" : "Update password"}
            </button>
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
