"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignUp() {
  const [role, setRole] = useState<"client" | "photographer">("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: role === "photographer"
          ? `${window.location.origin}/photographer-dashboard`
          : `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen" style={{backgroundColor: "#fff"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "2px solid #2C2C2A", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#2C2C2A", letterSpacing: "-1px", textDecoration: "none"}}>
            Lomissa
          </a>
          <span style={{fontSize: "8px", letterSpacing: "4px", color: "#888", paddingLeft: "8px", borderLeft: "1px solid #ddd"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-4">
          <span style={{fontSize: "12px", color: "#888"}}>Already have an account?</span>
          <a href="/login" style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "12px", padding: "7px 20px", textDecoration: "none"}}>
            Log in
          </a>
        </div>
      </nav>

      <div className="flex min-h-screen" style={{minHeight: "calc(100vh - 72px)"}}>

        {/* Left — dark block */}
        <div style={{flex: 1, backgroundColor: "#2C2C2A", padding: "64px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
          <div>
            <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 24px"}}>JOIN Lomissa</p>
            <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(32px, 3vw, 48px)", fontWeight: "700", color: "#fff", margin: "0 0 24px", letterSpacing: "-1px", lineHeight: "1.1"}}>
              The world's finest photography marketplace
            </h1>
            <p style={{fontSize: "14px", color: "#888", margin: "0", lineHeight: "1.8", maxWidth: "360px"}}>
              Connect with talented photographers worldwide. Book sessions, manage your bookings and create lasting memories.
            </p>
          </div>
          <div style={{borderTop: "1px solid #444", paddingTop: "32px"}}>
            <div className="flex flex-col gap-4">
              {[
                { num: "01", text: "Curated photographers worldwide" },
                { num: "02", text: "Secure booking and payments" },
                { num: "03", text: "Professional quality guaranteed" },
              ].map((item) => (
                <div key={item.num} className="flex items-center gap-4">
                  <span style={{fontSize: "11px", color: "#555", letterSpacing: "2px", flexShrink: 0}}>{item.num}</span>
                  <span style={{fontSize: "13px", color: "#888"}}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div style={{flex: 1, padding: "64px 48px", display: "flex", flexDirection: "column", justifyContent: "center"}}>

          {done ? (
            <div>
              <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 16px"}}>CHECK YOUR EMAIL</p>
              <h2 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 16px", letterSpacing: "-1px"}}>
                Almost there!
              </h2>
              <p style={{fontSize: "14px", color: "#888", margin: "0 0 32px", lineHeight: "1.8"}}>
                We sent a confirmation email to <strong style={{color: "#2C2C2A"}}>{email}</strong>. Click the link inside to activate your account.
              </p>
              <a href="/" style={{fontSize: "11px", color: "#2C2C2A", letterSpacing: "2px", textDecoration: "none", borderBottom: "1px solid #2C2C2A", paddingBottom: "2px"}}>
                BACK TO HOME
              </a>
            </div>
          ) : (
            <>
              <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 16px"}}>CREATE ACCOUNT</p>
              <h2 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 32px", letterSpacing: "-1px"}}>
                Join Lomissa
              </h2>

              {/* Role selector */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setRole("client")}
                  style={{flex: 1, padding: "12px", fontSize: "11px", letterSpacing: "2px", border: role === "client" ? "2px solid #2C2C2A" : "1px solid #e5e5e5", backgroundColor: role === "client" ? "#2C2C2A" : "#fff", color: role === "client" ? "#fff" : "#888", cursor: "pointer"}}
                >
                  I NEED A PHOTOGRAPHER
                </button>
                <button
                  onClick={() => setRole("photographer")}
                  style={{flex: 1, padding: "12px", fontSize: "11px", letterSpacing: "2px", border: role === "photographer" ? "2px solid #2C2C2A" : "1px solid #e5e5e5", backgroundColor: role === "photographer" ? "#2C2C2A" : "#fff", color: role === "photographer" ? "#fff" : "#888", cursor: "pointer"}}
                >
                  I AM A PHOTOGRAPHER
                </button>
              </div>

              {/* Name */}
              <div className="mb-5">
                <label style={{fontSize: "9px", letterSpacing: "3px", color: "#888", display: "block", marginBottom: "8px"}}>FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  style={{width: "100%", border: "1px solid #2C2C2A", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#2C2C2A", backgroundColor: "#fff", boxSizing: "border-box"}}
                />
              </div>

              {/* Email */}
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

              {/* Password */}
              <div className="mb-8">
                <label style={{fontSize: "9px", letterSpacing: "3px", color: "#888", display: "block", marginBottom: "8px"}}>PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{width: "100%", border: "1px solid #2C2C2A", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#2C2C2A", backgroundColor: "#fff", boxSizing: "border-box"}}
                />
              </div>

              {error && (
                <div style={{marginBottom: "16px", padding: "12px 16px", border: "1px solid #e5e5e5", backgroundColor: "#fff8f8"}}>
                  <p style={{fontSize: "12px", color: "#cc0000", margin: "0"}}>{error}</p>
                </div>
              )}

              <button
                onClick={handleSignUp}
                disabled={loading}
                style={{width: "100%", backgroundColor: "#2C2C2A", color: "#fff", fontSize: "11px", padding: "16px", border: "none", cursor: "pointer", letterSpacing: "3px", marginBottom: "16px"}}
              >
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>

              <p style={{fontSize: "11px", color: "#aaa", textAlign: "center", margin: "0", lineHeight: "1.7"}}>
                By signing up you agree to our terms and conditions
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}