"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function JoinAsPhotographer() {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    specialty: "",
    experience: "",
    instagram: "",
    website: "",
    portfolio_link: "",
    about: "",
  });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.about) {
      setError("Please fill in your name, email and about section.");
      return;
    }
    setSaving(true);
    setError("");

    const { error } = await supabase.from("applications").insert({
      name: form.name,
      email: form.email,
      location: form.location,
      specialty: form.specialty,
      experience: form.experience,
      instagram: form.instagram,
      website: form.website,
      portfolio_link: form.portfolio_link,
      about: form.about,
      status: "pending",
    });

    if (error) {
      setError("Something went wrong. Please try again.");
    } else {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photographerName: "Framio Team",
          photographerEmail: "muhannadsedqi@gmail.com",
          clientName: form.name,
          clientEmail: "muhannadsedqi@gmail.com",
          sessionType: `New application from ${form.name}`,
          date: new Date().toLocaleDateString(),
          location: form.location,
          message: `${form.about}\n\nInstagram: ${form.instagram}\nPortfolio: ${form.portfolio_link}\nExperience: ${form.experience}`,
          price: "Application",
        }),
      });
      setDone(true);
    }
    setSaving(false);
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    outline: "none",
    color: "#1a1a1a",
    backgroundColor: "#fff",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#888",
    display: "block",
    marginBottom: "8px",
    letterSpacing: "0.5px",
  };

  if (done) {
    return (
      <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>
        <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
          <div className="flex items-baseline gap-3">
            <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
            <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
          </div>
        </nav>
        <div style={{maxWidth: "600px", margin: "0 auto", padding: "80px 32px", textAlign: "center"}}>
          <div style={{fontSize: "56px", marginBottom: "24px"}}>🎉</div>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>APPLICATION RECEIVED</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px", letterSpacing: "-1px"}}>
            Thank you, {form.name}!
          </h1>
          <p style={{fontSize: "15px", color: "#888", margin: "0 0 32px", lineHeight: "1.8"}}>
            We have received your application to join Framio. Our team will review your portfolio and get back to you within 3 business days.
          </p>
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #f0f0f0", marginBottom: "32px", textAlign: "left"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>WHAT HAPPENS NEXT</p>
            {[
              "We review your portfolio and experience",
              "We check your Instagram and website",
              "You receive an email with our decision",
              "If approved your profile goes live on Framio",
            ].map((step, i) => (
              <div key={i} style={{display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px"}}>
                <span style={{fontSize: "12px", color: "#C4907A", flexShrink: 0, fontWeight: "600"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#888"}}>{step}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "8px", textDecoration: "none", display: "inline-block"}}>
            Back to Framio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <a href="/" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Back to home</a>
      </nav>

      {/* Hero */}
      <section style={{backgroundColor: "#1a1a1a", padding: "64px 48px", textAlign: "center"}}>
        <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 16px", letterSpacing: "1px"}}>JOIN FRAMIO</p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "700", color: "#fff", margin: "0 0 16px", letterSpacing: "-1px", lineHeight: "1.1"}}>
          Apply to join as<br/>a photographer
        </h1>
        <p style={{fontSize: "15px", color: "#888", margin: "0 auto", maxWidth: "480px", lineHeight: "1.8"}}>
          We hand-pick every photographer on Framio. Tell us about yourself and your work — we'll be in touch within 3 business days.
        </p>
      </section>

      {/* Stats */}
      <section style={{backgroundColor: "#fff", padding: "32px 48px", borderBottom: "1px solid #f0f0f0"}}>
        <div style={{maxWidth: "680px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "64px", flexWrap: "wrap"}}>
          {[
            { value: "3 days", label: "Average response time" },
            { value: "10%", label: "Commission only" },
            { value: "Free", label: "To join Framio" },
          ].map((stat) => (
            <div key={stat.label} style={{textAlign: "center"}}>
              <p style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{stat.value}</p>
              <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <div style={{maxWidth: "680px", margin: "0 auto", padding: "48px 32px"}}>

        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: "24px"}}>

          <div>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 20px", letterSpacing: "1px"}}>Personal details</p>
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Your full name" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="your@email.com" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="e.g. Bergen, Norway" style={inputStyle}/>
              </div>
            </div>
          </div>

          <div style={{borderTop: "1px solid #f0f0f0", paddingTop: "24px"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 20px", letterSpacing: "1px"}}>Your photography</p>
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              <div>
                <label style={labelStyle}>Specialty</label>
                <select value={form.specialty} onChange={(e) => setForm({...form, specialty: e.target.value})} style={inputStyle}>
                  <option value="">Select your specialty</option>
                  <option>Weddings</option>
                  <option>Portraits</option>
                  <option>Events</option>
                  <option>Travel</option>
                  <option>Fashion</option>
                  <option>Commercial</option>
                  <option>Street</option>
                  <option>Nature</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Years of experience</label>
                <select value={form.experience} onChange={(e) => setForm({...form, experience: e.target.value})} style={inputStyle}>
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
                  <span style={{padding: "12px 16px", backgroundColor: "#FAFAF8", color: "#C4907A", fontSize: "13px", borderRight: "1px solid #e5e5e5", flexShrink: 0}}>@</span>
                  <input type="text" value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 16px", fontSize: "13px", color: "#1a1a1a", backgroundColor: "#fff"}}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Portfolio link</label>
                <input type="text" value={form.portfolio_link} onChange={(e) => setForm({...form, portfolio_link: e.target.value})} placeholder="https://your-portfolio.com" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input type="text" value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder="https://yourwebsite.com" style={inputStyle}/>
              </div>
            </div>
          </div>

          <div style={{borderTop: "1px solid #f0f0f0", paddingTop: "24px"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 20px", letterSpacing: "1px"}}>About you</p>
            <div>
              <label style={labelStyle}>Tell us about yourself and your photography style *</label>
              <textarea
                value={form.about}
                onChange={(e) => setForm({...form, about: e.target.value})}
                placeholder="Tell us about your experience, your photography style, the kind of clients you work with and why you want to join Framio..."
                rows={6}
                style={{...inputStyle, resize: "none"}}
              />
              <p style={{fontSize: "11px", color: form.about.length > 450 ? "#C4907A" : "#aaa", margin: "6px 0 0", textAlign: "right"}}>{form.about.length}/500</p>
            </div>
          </div>

          {error && (
            <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
              <p style={{fontSize: "13px", color: "#cc0000", margin: "0"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{width: "100%", backgroundColor: "#C4907A", color: "#fff", fontSize: "14px", padding: "16px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600"}}
          >
            {saving ? "Submitting application..." : "Submit application"}
          </button>

          <p style={{fontSize: "12px", color: "#aaa", textAlign: "center", margin: "0", lineHeight: "1.7"}}>
            By applying you agree to Framio's terms. We review every application manually and will contact you within 3 business days.
          </p>

        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>Framio</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Framio. All rights reserved.</p>
      </footer>

    </main>
  );
}