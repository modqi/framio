"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const role = data.user?.user_metadata?.role;
    window.location.href = role === "photographer" ? "/photographer-dashboard" : "/dashboard";
  };

  return (
    <main className="min-h-screen" style={{backgroundColor: "#fff"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "2px solid #2C2C2A", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#2C2C2A", letterSpacing: "-1px", textDecoration: "none"}}>
            Frameyou
          </a>
          <span style={{fontSize: "8px", letterSpacing: "4px", color: "#888", paddingLeft: "8px", borderLeft: "1px solid #ddd"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-4">
          <span style={{fontSize: "12px", color: "#888"}}>No account yet?</span>
          <a href="/signup" style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "12px", padding: "7px 20px", textDecoration: "none"}}>
            Sign up
          </a>
        </div>
      </nav>

      <div className="flex" style={{minHeight: "calc(100vh - 72px)"}}>

        {/* Left — dark block */}
        <div style={{flex: 1, backgroundColor: "#2C2C2A", padding: "64px 48px", display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 24px"}}>WELCOME BACK</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(32px, 3vw, 48px)", fontWeight: "700", color: "#fff", margin: "0 0 24px", letterSpacing: "-1px", lineHeight: "1.1"}}>
            The world's finest photography marketplace
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0", lineHeight: "1.8", maxWidth: "360px"}}>
            Sign in to manage your bookings, update your profile and connect with photographers worldwide.
          </p>
        </div>

        {/* Right — form */}
        <div style={{flex: 1, padding: "64px 48px", display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 16px"}}>SIGN IN</p>
          <h2 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 40px", letterSpacing: "-1px"}}>
            Welcome back
          </h2>

          <div className="mb-5">
            <label style={{fontSize: "9px", letterSpacing: "3px", color: "#888", display: "block", marginBottom: "8px"}}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{width: "100%", border: "1px solid #2C2C2A", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#2C2C2A", backgroundColor: "#fff", boxSizing: "border-box"}}
            />
          </div>

          <div className="mb-8">
            <label style={{fontSize: "9px", letterSpacing: "3px", color: "#888", display: "block", marginBottom: "8px"}}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              style={{width: "100%", border: "1px solid #2C2C2A", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#2C2C2A", backgroundColor: "#fff", boxSizing: "border-box"}}
            />
          </div>

          {error && (
            <div style={{marginBottom: "16px", padding: "12px 16px", border: "1px solid #e5e5e5", backgroundColor: "#fff8f8"}}>
              <p style={{fontSize: "12px", color: "#cc0000", margin: "0"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{width: "100%", backgroundColor: "#2C2C2A", color: "#fff", fontSize: "11px", padding: "16px", border: "none", cursor: "pointer", letterSpacing: "3px", marginBottom: "24px"}}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>

          <p style={{fontSize: "12px", color: "#888", textAlign: "center", margin: "0"}}>
            Don't have an account?{" "}
            <a href="/signup" style={{color: "#2C2C2A", textDecoration: "none", borderBottom: "1px solid #2C2C2A", paddingBottom: "1px"}}>
              Join Frameyou
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}