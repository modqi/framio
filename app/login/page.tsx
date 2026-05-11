"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import GlobeModal from "../components/GlobeModal";

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
    else if (role === "pending_photographer") { window.location.href = "/pending"; }
    else {
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      window.location.href = (redirect && redirect.startsWith("/")) ? redirect : "/dashboard";
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex" style={{backgroundColor: "#FDFBF8", position: "relative"}}>
      <div style={{position: "absolute", top: "16px", right: "24px", zIndex: 10}}><GlobeModal /></div>

      {/* Left — warm panel */}
      <div className="hidden md:flex flex-col justify-between" style={{width: "45%", backgroundColor: "#1A0E06", padding: "48px", flexShrink: 0}}>
        <Logo size="sm" href="/" color="#FDFBF8" accent="#C1622F" />
        <div>
          <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#FDFBF8", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.2"}}>
            Welcome back to Lomissa
          </p>
          <p style={{fontSize: "14px", color: "rgba(253,251,248,0.5)", margin: "0", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            Log in to manage your bookings and connect with photographers.
          </p>
        </div>
        <p style={{fontSize: "12px", color: "rgba(253,251,248,0.3)", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1" style={{padding: "48px 32px", maxWidth: "560px", margin: "0 auto"}}>

        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>WELCOME BACK</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>Log in</h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            Don't have an account?{" "}
            <a href="/signup" style={{color: "#C8622A", textDecoration: "none", fontWeight: "500"}}>Sign up</a>
          </p>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>

          <div>
            <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
            />
          </div>

          <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px"}}>
              <label style={{fontSize: "11px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>Password</label>
              <a href="/reset-password" style={{fontSize: "12px", color: "#C8622A", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Forgot your password?</a>
            </div>
            <div style={{position: "relative"}}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "12px 16px", paddingRight: "60px", fontSize: "14px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
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

          {error && (
            <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
              <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginTop: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em", boxShadow: "0 4px 20px rgba(184,85,40,0.3)"}}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          <div style={{textAlign: "center", paddingTop: "16px", borderTop: "1px solid #E2D5C8"}}>
            <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>
              Don't have an account?{" "}
              <a href="/signup" style={{color: "#C8622A", textDecoration: "none", fontWeight: "500"}}>Sign up free</a>
            </p>
            <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
              Are you a photographer?{" "}
              <a href="/signup" style={{color: "#C8622A", textDecoration: "none", fontWeight: "500"}}>Apply to join</a>
            </p>
          </div>

        </div>
      </div>

    </main>
  );
}