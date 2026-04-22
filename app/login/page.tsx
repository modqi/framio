"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Invalid email or password. Please try again."); setLoading(false); return; }
    const user = data.user;
    const role = user?.user_metadata?.role;
    if (role === "photographer") { window.location.href = "/photographer-dashboard"; }
    else { window.location.href = "/dashboard"; }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex" style={{backgroundColor: "#FAFAF8"}}>

      {/* Left — dark panel */}
      <div className="hidden md:flex flex-col justify-between" style={{width: "45%", backgroundColor: "#1a1a1a", padding: "48px", flexShrink: 0}}>
        <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#fff", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#fff", margin: "0 0 16px", letterSpacing: "-1px", lineHeight: "1.2"}}>
            Welcome back to Lomissa
          </p>
          <p style={{fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: "0", lineHeight: "1.8"}}>
            Log in to manage your bookings and connect with photographers.
          </p>
        </div>
        <p style={{fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: "0"}}>© 2026 Lomissa</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1" style={{padding: "48px 32px", maxWidth: "560px", margin: "0 auto"}}>

        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Welcome back</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>Log in</h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>
            Don't have an account?{" "}
            <a href="/signup" style={{color: "#C4907A", textDecoration: "none"}}>Sign up</a>
          </p>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>

          <div>
            <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", boxSizing: "border-box"}}
            />
          </div>

          <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px"}}>
              <label style={{fontSize: "11px", color: "#888"}}>Password</label>
              <a href="/reset-password" style={{fontSize: "12px", color: "#C4907A", textDecoration: "none"}}>Forgot your password?</a>
            </div>
            <div style={{position: "relative"}}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 16px", paddingRight: "60px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", boxSizing: "border-box"}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#888", padding: "0"}}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
              <p style={{fontSize: "13px", color: "#cc0000", margin: "0"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{width: "100%", backgroundColor: "#1a1a1a", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginTop: "8px"}}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          <div style={{textAlign: "center", paddingTop: "16px", borderTop: "1px solid #f0f0f0"}}>
            <p style={{fontSize: "13px", color: "#888", margin: "0 0 8px"}}>
              Don't have an account?{" "}
              <a href="/signup" style={{color: "#C4907A", textDecoration: "none"}}>Sign up free</a>
            </p>
            <p style={{fontSize: "13px", color: "#888", margin: "0"}}>
              Are you a photographer?{" "}
              <a href="/join" style={{color: "#C4907A", textDecoration: "none"}}>Apply to join</a>
            </p>
          </div>

        </div>
      </div>

    </main>
  );
}