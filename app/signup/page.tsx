"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function Signup() {
  const [role, setRole] = useState("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [about, setAbout] = useState("");

  const handleClientSignup = async () => {
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "client", name },
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

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "pending_photographer", name },
        emailRedirectTo: "https://lomissa.com/auth/confirm",
      },
    });

    if (signupError) { setError(signupError.message); setLoading(false); return; }

    const { error: appError } = await supabase.from("applications").insert({
      name, email, location, specialty, experience,
      instagram, portfolio_link: portfolio, about, status: "pending",
    });

    if (appError) { setError("Something went wrong. Please try again."); setLoading(false); return; }

    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photographerName: "Lomissa Team",
        photographerEmail: "hello@lomissa.com",
        clientName: name,
        clientEmail: "hello@lomissa.com",
        type: "photographer_application",
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
    border: "1px solid #E4D8C4",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    color: "#1C1009",
    backgroundColor: "#FDFBF7",
    boxSizing: "border-box",
    fontFamily: "'Jost', sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#7A5235",
    display: "block",
    marginBottom: "6px",
    fontFamily: "'Jost', sans-serif",
    letterSpacing: "0.05em",
  };

  if (done && role === "client") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "16px", padding: "48px 32px", border: "1px solid #E4D8C4", textAlign: "center", maxWidth: "480px"}}>
          <div style={{fontSize: "48px", marginBottom: "24px"}}>🎉</div>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>WELCOME TO LOMISSA</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1C1009", margin: "0 0 16px"}}>Account created!</h1>
          <p style={{fontSize: "14px", color: "#7A5235", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            Your account has been created. You can now log in and start booking photographers.
          </p>
          <a href="/login" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            Log in now
          </a>
        </div>
      </main>
    );
  }

  if (done && role === "photographer") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "16px", padding: "48px 32px", border: "1px solid #E4D8C4", textAlign: "center", maxWidth: "480px"}}>
          <div style={{fontSize: "48px", marginBottom: "24px"}}>🎉</div>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>APPLICATION RECEIVED</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1C1009", margin: "0 0 16px"}}>Thank you, {name}!</h1>
          <p style={{fontSize: "14px", color: "#7A5235", margin: "0 0 24px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            We have received your application. Our team will review your portfolio and get back to you within 3 business days.
          </p>
          <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "16px", marginBottom: "24px", textAlign: "left"}}>
            {[
              "We review your portfolio and experience",
              "We check your Instagram and website",
              "You receive an email with our decision",
              "If approved you can log in immediately",
            ].map((step, i) => (
              <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 3 ? "10px" : "0"}}>
                <span style={{fontSize: "12px", color: "#B85528", flexShrink: 0, fontWeight: "600", fontFamily: "'Jost', sans-serif"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#7A5235", fontFamily: "'Jost', sans-serif"}}>{step}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{backgroundColor: "#1C1009", color: "#FAF7F1", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            Back to Lomissa
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex" style={{backgroundColor: "#FAF7F1"}}>

      {/* Left — dark panel */}
      <div className="hidden md:flex flex-col justify-between" style={{width: "45%", backgroundColor: "#1C1009", padding: "48px", flexShrink: 0}}>
        <Logo size="sm" href="/" color="#FAF7F1" accent="#C1622F" />
        <div>
          {role === "client" ? (
            <>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#FAF7F1", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.2"}}>
                Your moment deserves the perfect photographer
              </p>
              <p style={{fontSize: "14px", color: "rgba(250,247,241,0.5)", margin: "0", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
                Connect with hand-picked photographers for your most important moments.
              </p>
            </>
          ) : (
            <>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#FAF7F1", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.2"}}>
                Join the photography marketplace launching worldwide
              </p>
              <p style={{fontSize: "14px", color: "rgba(250,247,241,0.5)", margin: "0 0 32px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
                We hand-pick every photographer on Lomissa. Apply today and start receiving bookings.
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {[
                  { value: "Free", label: "To join Lomissa" },
                  { value: "10%", label: "Commission only" },
                  { value: "3 days", label: "Average response time" },
                ].map((stat) => (
                  <div key={stat.label} style={{display: "flex", alignItems: "center", gap: "16px"}}>
                    <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", fontWeight: "500", color: "#C1622F", margin: "0", minWidth: "60px"}}>{stat.value}</p>
                    <p style={{fontSize: "13px", color: "rgba(250,247,241,0.4)", margin: "0", fontFamily: "'Jost', sans-serif"}}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <p style={{fontSize: "12px", color: "rgba(250,247,241,0.3)", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1" style={{padding: "48px 32px", maxWidth: "600px", margin: "0 auto", overflowY: "auto"}}>

        <div style={{marginBottom: "32px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>GET STARTED</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1C1009", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {role === "client" ? "Create account" : "Apply to join"}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5235", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            Already have an account?{" "}
            <a href="/login" style={{color: "#B85528", textDecoration: "none", fontWeight: "500"}}>Log in</a>
          </p>
        </div>

        {/* Role selector */}
        <div style={{display: "flex", gap: "8px", marginBottom: "32px", backgroundColor: "#F5EFE4", padding: "4px", borderRadius: "999px"}}>
          <button
            onClick={() => { setRole("client"); setError(""); }}
            style={{flex: 1, padding: "10px", border: "none", borderRadius: "999px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "client" ? "#B85528" : "transparent", color: role === "client" ? "#FAF7F1" : "#7A5235", fontWeight: "500", transition: "all 0.2s", fontFamily: "'Jost', sans-serif"}}
          >
            I want to book
          </button>
          <button
            onClick={() => { setRole("photographer"); setError(""); }}
            style={{flex: 1, padding: "10px", border: "none", borderRadius: "999px", fontSize: "13px", cursor: "pointer", backgroundColor: role === "photographer" ? "#B85528" : "transparent", color: role === "photographer" ? "#FAF7F1" : "#7A5235", fontWeight: "500", transition: "all 0.2s", fontFamily: "'Jost', sans-serif"}}
          >
            I am a photographer
          </button>
        </div>

        {/* Client form */}
        {role === "client" && (
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" onKeyDown={(e) => e.key === "Enter" && handleClientSignup()} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={(e) => e.key === "Enter" && handleClientSignup()} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{position: "relative"}}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" onKeyDown={(e) => e.key === "Enter" && handleClientSignup()} style={{...inputStyle, paddingRight: "60px"}}/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#9E7250", padding: "0", fontFamily: "'Jost', sans-serif"}}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {error && (
              <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
              </div>
            )}
            <button onClick={handleClientSignup} disabled={loading} style={{width: "100%", backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginTop: "8px", fontFamily: "'Jost', sans-serif", boxShadow: "0 4px 20px rgba(184,85,40,0.3)"}}>
              {loading ? "Creating account..." : "Create account"}
            </button>
            <p style={{fontSize: "11px", color: "#C3AB88", textAlign: "center", margin: "0", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>
              By signing up you agree to our{" "}
              <a href="/terms" style={{color: "#9E7250", textDecoration: "none"}}>Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" style={{color: "#9E7250", textDecoration: "none"}}>Privacy Policy</a>
            </p>
          </div>
        )}

        {/* Photographer application form */}
        {role === "photographer" && (
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>

            <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "12px 16px", border: "1px solid #E4D8C4"}}>
              <p style={{fontSize: "13px", color: "#B85528", margin: "0", fontFamily: "'Jost', sans-serif"}}>
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
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={{...inputStyle, paddingRight: "60px"}}/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#9E7250", padding: "0", fontFamily: "'Jost', sans-serif"}}>
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
                <div style={{display: "flex", alignItems: "center", border: "1px solid #E4D8C4", borderRadius: "8px", overflow: "hidden", backgroundColor: "#FDFBF7"}}>
                  <span style={{padding: "12px 12px", backgroundColor: "#F5EFE4", color: "#B85528", fontSize: "13px", borderRight: "1px solid #E4D8C4", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>@</span>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 12px", fontSize: "14px", color: "#1C1009", backgroundColor: "#FDFBF7", fontFamily: "'Jost', sans-serif"}}/>
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Portfolio link</label>
              <input type="text" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://your-portfolio.com" style={inputStyle}/>
            </div>

            <div>
              <label style={labelStyle}>About you and your photography style *</label>
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell us about your experience, your style and why you want to join Lomissa..." rows={4} style={{...inputStyle, resize: "none"}}/>
              <p style={{fontSize: "11px", color: about.length > 450 ? "#B85528" : "#C3AB88", margin: "4px 0 0", textAlign: "right", fontFamily: "'Jost', sans-serif"}}>{about.length}/500</p>
            </div>

            {error && (
              <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
              </div>
            )}

            <button onClick={handlePhotographerApply} disabled={loading} style={{width: "100%", backgroundColor: "#1C1009", color: "#FAF7F1", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginTop: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
              {loading ? "Submitting application..." : "Apply to join Lomissa"}
            </button>

            <p style={{fontSize: "11px", color: "#C3AB88", textAlign: "center", margin: "0", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>
              By applying you agree to our{" "}
              <a href="/terms" style={{color: "#9E7250", textDecoration: "none"}}>Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" style={{color: "#9E7250", textDecoration: "none"}}>Privacy Policy</a>
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