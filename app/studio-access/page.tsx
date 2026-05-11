"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function StudioAccess() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) { setError("Invalid credentials."); setLoading(false); return; }

    const { data: adminData } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", data.user.email)
      .single();

    if (!adminData) {
      await supabase.auth.signOut();
      setError("You are not authorized to access this page.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#1A0E06"}}>
      <div style={{width: "100%", maxWidth: "400px", padding: "0 24px"}}>

        <div style={{textAlign: "center", marginBottom: "40px"}}>
          <Logo size="sm" asLink={false} color="#FDFBF8" accent="#C8622A" />
          <p style={{fontSize: "11px", letterSpacing: "0.25em", color: "#C8622A", margin: "12px 0 0", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>STUDIO ACCESS</p>
        </div>

        <div style={{backgroundColor: "rgba(253,251,248,0.05)", borderRadius: "12px", padding: "32px", border: "1px solid rgba(253,251,248,0.1)"}}>

          <div style={{marginBottom: "16px"}}>
            <label style={{fontSize: "11px", color: "rgba(253,251,248,0.5)", display: "block", marginBottom: "8px", letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif"}}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="your@lomissa.com"
              style={{width: "100%", border: "1px solid rgba(253,251,248,0.1)", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#FDFBF8", backgroundColor: "rgba(253,251,248,0.05)", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
            />
          </div>

          <div style={{marginBottom: "24px"}}>
            <label style={{fontSize: "11px", color: "rgba(253,251,248,0.5)", display: "block", marginBottom: "8px", letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif"}}>Password</label>
            <div style={{position: "relative"}}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Your password"
                style={{width: "100%", border: "1px solid rgba(253,251,248,0.1)", borderRadius: "8px", padding: "12px 16px", paddingRight: "60px", fontSize: "13px", outline: "none", color: "#FDFBF8", backgroundColor: "rgba(253,251,248,0.05)", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(253,251,248,0.4)", padding: "0", fontFamily: "'Jost', sans-serif"}}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)"}}>
              <p style={{fontSize: "12px", color: "#f87171", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: loading ? "default" : "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", opacity: loading ? 0.7 : 1}}
          >
            {loading ? "Accessing…" : "Access studio"}
          </button>
        </div>

        <p style={{textAlign: "center", fontSize: "12px", color: "rgba(253,251,248,0.2)", margin: "24px 0 0", fontFamily: "'Jost', sans-serif"}}>
          This page is private. Unauthorized access is prohibited.
        </p>
      </div>
    </main>
  );
}
