"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
        </div>
      </nav>

      <div style={{maxWidth: "480px", margin: "80px auto", padding: "0 32px"}}>
        {done ? (
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "48px 32px", border: "1px solid #f0f0f0", textAlign: "center"}}>
            <div style={{fontSize: "48px", marginBottom: "24px"}}>✅</div>
            <h1 style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px"}}>
              Password updated!
            </h1>
            <p style={{fontSize: "14px", color: "#888", margin: "0 0 32px", lineHeight: "1.7"}}>
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <a href="/login" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "8px", textDecoration: "none", display: "inline-block"}}>
              Log in
            </a>
          </div>
        ) : (
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "48px 32px", border: "1px solid #f0f0f0"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>ACCOUNT RECOVERY</p>
            <h1 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
              Set new password
            </h1>
            <p style={{fontSize: "14px", color: "#888", margin: "0 0 32px", lineHeight: "1.7"}}>
              Choose a strong password for your Lomissa account.
            </p>

            <div style={{marginBottom: "16px"}}>
              <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", boxSizing: "border-box"}}
              />
            </div>

            <div style={{marginBottom: "24px"}}>
              <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", boxSizing: "border-box"}}
              />
            </div>

            {error && (
              <div style={{marginBottom: "16px", padding: "12px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
                <p style={{fontSize: "12px", color: "#cc0000", margin: "0"}}>{error}</p>
              </div>
            )}

            <button
              onClick={handleUpdate}
              disabled={loading}
              style={{width: "100%", backgroundColor: "#C4907A", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600"}}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
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