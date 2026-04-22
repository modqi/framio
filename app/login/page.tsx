"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: "https://lomissa.com/auth/confirm",
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAFAF8"}}>
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "48px 32px", border: "1px solid #f0f0f0", textAlign: "center", maxWidth: "480px"}}>
          <div style={{fontSize: "48px", marginBottom: "24px"}}>📧</div>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>CHECK YOUR EMAIL</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px"}}>Almost there!</h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0 0 32px", lineHeight: "1.7"}}>
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
          <a href="/login" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "8px", textDecoration: "none", display: "inline-block"}}>
            Back to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex" style={{backgroundColor: "#FAFAF8"}}>

      {/* Left — dark panel */}
      <div className="hidden md:flex flex-col justify-between" style={{width: "45%", backgroundColor: "#1a1a1a", padding: "48px", flexShrink: 0}}>
        <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#fff", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#fff", margin: "0 0 16px", letterSpacing: "-1px", lineHeight: "1.2"}}>
            Join the photography marketplace launching worldwide
          </p>
          <p style={{fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: "0", lineHeight: "1.8"}}>
            Connect with hand-picked photographers for your most important moments.
          </p>
        </div>
        <p style={{fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: "0"}}>© 2026 Lomissa</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1" style={{padding: "48px 32px", maxWidth: "560px", margin: "0 auto"}}>

        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Get started</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>Create account</h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>
            Already have an account?{" "}
            <a href="/login" style={{color: "#C4907A", textDecoration: "none"}}>Log in</a>
          </p>
        </div>

        {/* Role selector */}
        <div style={{display: "flex", gap: "8px", marginBottom: "24px", backgroundColor: "#f5f5f5", padding: "4px", borderRadius: "8px"}}>
          <button
            onClick={() => setRole("client")}
            style={{flex: 1, padding: "10px", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "client" ? "#fff" : "transparent", color: role === "client" ? "#1a1a1a" : "#888", fontWeight: role === "client" ? "600" : "400", boxShadow: role === "client" ? "0 1px 4px rgba(0,0,0,0.08)" : "none"}}
          >
            I want to book
          </button>
          <button
            onClick={() => setRole("photographer")}
            style={{flex: 1, padding: "10px", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "photographer" ? "#fff" : "transparent", color: role === "photographer" ? "#1a1a1a" : "#888", fontWeight: role === "photographer" ? "600" : "400", boxShadow: role === "photographer" ? "0 1px 4px rgba(0,0,0,0.08)" : "none"}}
          >
            I am a photographer
          </button>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>

          <div>
            <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", boxSizing: "border-box"}}
            />
          </div>

          <div>
            <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Password</label>
            <div style={{position: "relative"}}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
            onClick={handleSignup}
            disabled={loading}
            style={{width: "100%", backgroundColor: "#C4907A", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginTop: "8px"}}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p style={{fontSize: "11px", color: "#aaa", textAlign: "center", margin: "0", lineHeight: "1.7"}}>
            By signing up you agree to our{" "}
            <a href="/terms" style={{color: "#888", textDecoration: "none"}}>Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" style={{color: "#888", textDecoration: "none"}}>Privacy Policy</a>
          </p>

        </div>
      </div>

    </main>
  );
}