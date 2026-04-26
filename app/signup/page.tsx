"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Signup() {
  const [role, setRole] = useState("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Photographer fields
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [about, setAbout] = useState("");

  const handleClientSignup = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "client" },
        emailRedirectTo: "https://lomissa.com/auth/confirm",
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  };

  const handlePhotographerApply = async () => {
    if (!name || !email || !password || !specialty || !about) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "pending_photographer", name },
        emailRedirectTo: "https://lomissa.com/auth/confirm",
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    const { error: appError } = await supabase.from("applications").insert({
      name,
      email,
      location,
      specialty,
      experience,
      instagram,
      portfolio_link: portfolio,
      about,
      status: "pending",
    });

    if (appError) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photographerName: "Lomissa Team",
        photographerEmail: "hello@lomissa.com",
        clientName: name,
        clientEmail: "hello@lomissa.com",
        sessionType: `New photographer application from ${name}`,
        date: new Date().toLocaleDateString(),
        location,
        message: `${about}\n\nInstagram: ${instagram}\nPortfolio: ${portfolio}\nExperience: ${experience}`,
        price: "Application",
      }),
    });

    setDone(true);
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    outline: "none",
    color: "#1a1a1a",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#888",
    display: "block",
    marginBottom: "6px",
  };

  if (done && role === "client") {
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

  if (done && role === "photographer") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAFAF8"}}>
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "48px 32px", border: "1px solid #f0f0f0", textAlign: "center", maxWidth: "480px"}}>
          <div style={{fontSize: "48px", marginBottom: "24px"}}>🎉</div>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>APPLICATION RECEIVED</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px"}}>Thank you, {name}!</h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0 0 24px", lineHeight: "1.7"}}>
            We have received your application. Our team will review your portfolio and get back to you within 3 business days.
          </p>
          <div style={{backgroundColor: "#FDF8F5", borderRadius: "8px", padding: "16px", marginBottom: "24px", textAlign: "left"}}>
            {[
              "We review your portfolio and experience",
              "We check your Instagram and website",
              "You receive an email with our decision",
              "If approved you can log in immediately",
            ].map((step, i) => (
              <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 3 ? "10px" : "0"}}>
                <span style={{fontSize: "12px", color: "#C4907A", flexShrink: 0, fontWeight: "600"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#888"}}>{step}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "8px", textDecoration: "none", display: "inline-block"}}>
            Back to Lomissa
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
          {role === "client" ? (
            <>
              <p style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#fff", margin: "0 0 16px", letterSpacing: "-1px", lineHeight: "1.2"}}>
                Your moment deserves the perfect photographer
              </p>
              <p style={{fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: "0", lineHeight: "1.8"}}>
                Connect with hand-picked photographers for your most important moments.
              </p>
            </>
          ) : (
            <>
              <p style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#fff", margin: "0 0 16px", letterSpacing: "-1px", lineHeight: "1.2"}}>
                Join the photography marketplace launching worldwide
              </p>
              <p style={{fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: "0 0 32px", lineHeight: "1.8"}}>
                We hand-pick every photographer on Lomissa. Apply today and start receiving bookings.
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {[
                  { value: "Free", label: "To join Lomissa" },
                  { value: "10%", label: "Commission only" },
                  { value: "3 days", label: "Average response time" },
                ].map((stat) => (
                  <div key={stat.label} style={{display: "flex", alignItems: "center", gap: "16px"}}>
                    <p style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#C4907A", margin: "0", minWidth: "60px"}}>{stat.value}</p>
                    <p style={{fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0"}}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <p style={{fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: "0"}}>© 2026 Lomissa</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1" style={{padding: "48px 32px", maxWidth: "600px", margin: "0 auto", overflowY: "auto"}}>

        <div style={{marginBottom: "32px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Get started</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
            {role === "client" ? "Create account" : "Apply to join"}
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>
            Already have an account?{" "}
            <a href="/login" style={{color: "#C4907A", textDecoration: "none"}}>Log in</a>
          </p>
        </div>

        {/* Role selector */}
        <div style={{display: "flex", gap: "8px", marginBottom: "32px", backgroundColor: "#f5f5f5", padding: "4px", borderRadius: "8px"}}>
          <button
            onClick={() => { setRole("client"); setError(""); }}
            style={{flex: 1, padding: "10px", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "client" ? "#fff" : "transparent", color: role === "client" ? "#1a1a1a" : "#888", fontWeight: role === "client" ? "600" : "400", boxShadow: role === "client" ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s"}}
          >
            I want to book
          </button>
          <button
            onClick={() => { setRole("photographer"); setError(""); }}
            style={{flex: 1, padding: "10px", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "photographer" ? "#fff" : "transparent", color: role === "photographer" ? "#1a1a1a" : "#888", fontWeight: role === "photographer" ? "600" : "400", boxShadow: role === "photographer" ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s"}}
          >
            I am a photographer
          </button>
        </div>

        {/* Client form */}
        {role === "client" && (
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleClientSignup()}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{position: "relative"}}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  onKeyDown={(e) => e.key === "Enter" && handleClientSignup()}
                  style={{...inputStyle, paddingRight: "60px"}}
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
              onClick={handleClientSignup}
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
        )}

        {/* Photographer application form */}
        {role === "photographer" && (
          <div style={{display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.3s ease"}}>

            <div style={{backgroundColor: "#FDF8F5", borderRadius: "8px", padding: "12px 16px", border: "1px solid #f0e8e0"}}>
              <p style={{fontSize: "13px", color: "#C4907A", margin: "0"}}>
                ✓ We review every application personally and respond within 3 business days.
              </p>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Email address *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle}/>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Password *</label>
              <div style={{position: "relative"}}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{...inputStyle, paddingRight: "60px"}}
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

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
              <div>
                <label style={labelStyle}>Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bergen, Norway" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Specialty *</label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle}>
                  <option value="">Select specialty</option>
                  <option>Portraits</option>
                  <option>Weddings</option>
                  <option>Events</option>
                  <option>Travel</option>
                  <option>Fashion</option>
                  <option>Commercial</option>
                  <option>Street</option>
                  <option>Nature</option>
                </select>
              </div>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
              <div>
                <label style={labelStyle}>Years of experience</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)} style={inputStyle}>
                  <option value="">Select experience</option>
                  <option>Less than 1 year</option>
                  <option>1-2 years</option>
                  <option>3-5 years</option>
                  <option>5-10 years</option>
                  <option>More than 10 years</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Instagram handle</label>
                <div style={{display: "flex", alignItems: "center", border: "1px solid #e5e5e5", borderRadius: "8px", overflow: "hidden"}}>
                  <span style={{padding: "12px 12px", backgroundColor: "#FAFAF8", color: "#C4907A", fontSize: "13px", borderRight: "1px solid #e5e5e5", flexShrink: 0}}>@</span>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 12px", fontSize: "13px", color: "#1a1a1a", backgroundColor: "#fff"}}/>
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Portfolio link</label>
              <input type="text" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://your-portfolio.com" style={inputStyle}/>
            </div>

            <div>
              <label style={labelStyle}>About you and your photography style *</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell us about your experience, your style and why you want to join Lomissa..."
                rows={4}
                style={{...inputStyle, resize: "none"}}
              />
              <p style={{fontSize: "11px", color: about.length > 450 ? "#C4907A" : "#aaa", margin: "4px 0 0", textAlign: "right"}}>{about.length}/500</p>
            </div>

            {error && (
              <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
                <p style={{fontSize: "13px", color: "#cc0000", margin: "0"}}>{error}</p>
              </div>
            )}

            <button
              onClick={handlePhotographerApply}
              disabled={loading}
              style={{width: "100%", backgroundColor: "#1a1a1a", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginTop: "8px"}}
            >
              {loading ? "Submitting application..." : "Apply to join Lomissa"}
            </button>

            <p style={{fontSize: "11px", color: "#aaa", textAlign: "center", margin: "0", lineHeight: "1.7"}}>
              By applying you agree to our{" "}
              <a href="/terms" style={{color: "#888", textDecoration: "none"}}>Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" style={{color: "#888", textDecoration: "none"}}>Privacy Policy</a>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </main>
  );
}