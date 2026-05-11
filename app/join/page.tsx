"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import { ReviewStarIcon } from "../components/Icons";

const CATEGORIES = ["Weddings", "Portraits", "Family & Newborn", "Real Estate", "Products", "Events", "Lomissa"];

export default function JoinAsPhotographer() {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    location: "",
    experience: "",
    instagram: "",
    website: "",
    portfolio_link: "",
    about: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherCategory, setOtherCategory] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone_number || !form.about) {
      setError("Please fill in your name, email, phone number and about section.");
      return;
    }
    setSaving(true);
    setError("");

    const finalSpecialities = [
      ...selectedCategories,
      ...(otherChecked && otherCategory.trim() ? [otherCategory.trim()] : []),
    ];

    const { error } = await supabase.from("applications").insert({
      name: form.name,
      email: form.email,
      phone_number: form.phone_number || null,
      location: form.location,
      specialty: finalSpecialities.join(", ") || "",
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
          photographerName: "Lomissa Team",
          photographerEmail: "muhannadsedqi@gmail.com",
          clientName: form.name,
          clientEmail: "muhannadsedqi@gmail.com",
          type: "photographer_application",
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
    border: "1px solid #E2D5C8",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    outline: "none",
    color: "#1A0E06",
    backgroundColor: "#FDFBF8",
    boxSizing: "border-box" as const,
    fontFamily: "'Jost', sans-serif",
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#7A5C44",
    display: "block",
    marginBottom: "8px",
    letterSpacing: "0.05em",
    fontFamily: "'Jost', sans-serif",
  };

  if (done) {
    return (
      <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>
        <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
          <Logo size="sm" />
        </nav>
        <div style={{maxWidth: "600px", margin: "0 auto", padding: "80px 32px", textAlign: "center"}}>
          <div style={{marginBottom: "24px"}}><ReviewStarIcon size={56} color="#C8622A"/></div>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>APPLICATION RECEIVED</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px", letterSpacing: "-0.02em"}}>
            Thank you, {form.name}
          </h1>
          <p style={{fontSize: "15px", color: "#7A5C44", margin: "0 0 40px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            We have received your application to join Lomissa. Our team will review your portfolio and get back to you within 3 business days.
          </p>
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "28px", border: "1px solid #E2D5C8", marginBottom: "40px", textAlign: "left"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>WHAT HAPPENS NEXT</p>
            {[
              "We review your portfolio and experience",
              "We check your Instagram and website",
              "You receive an email with our decision",
              "If approved your profile goes live on Lomissa",
            ].map((step, i) => (
              <div key={i} style={{display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: i < 3 ? "14px" : "0"}}>
                <span style={{fontSize: "11px", color: "#C8622A", flexShrink: 0, fontWeight: "500", fontFamily: "'Jost', sans-serif", paddingTop: "2px"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", lineHeight: "1.6"}}>{step}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px 40px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            Back to Lomissa
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>← Back to home</a>
      </nav>

      {/* Hero */}
      <section style={{backgroundColor: "#1A0E06", padding: "64px 48px", textAlign: "center"}}>
        <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>JOIN LOMISSA</p>
        <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "400", color: "#FDFBF8", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.1"}}>
          Apply to join as<br/>a photographer
        </h1>
        <p style={{fontSize: "15px", color: "#DDD0C0", margin: "0 auto", maxWidth: "480px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
          We hand-pick every photographer on Lomissa. Tell us about yourself and your work — we'll be in touch within 3 business days.
        </p>
      </section>

      {/* Stats */}
      <section style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderBottom: "1px solid #E2D5C8"}}>
        <div style={{maxWidth: "680px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "64px", flexWrap: "wrap"}}>
          {[
            { value: "3 days", label: "Average response time" },
            { value: "10%", label: "Commission only" },
            { value: "Free", label: "To join Lomissa" },
          ].map((stat) => (
            <div key={stat.label} style={{textAlign: "center"}}>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0 0 4px", letterSpacing: "-0.02em"}}>{stat.value}</p>
              <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <div style={{maxWidth: "680px", margin: "0 auto", padding: "48px 32px"}}>

        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", display: "flex", flexDirection: "column", gap: "24px"}}>

          <div>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>PERSONAL DETAILS</p>
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
                <label style={labelStyle}>Phone number *</label>
                <input type="tel" value={form.phone_number} onChange={(e) => setForm({...form, phone_number: e.target.value})} placeholder="+47 900 00 000" style={inputStyle}/>
                <p style={{fontSize: "11px", color: "#7A5C44", margin: "6px 0 0", fontFamily: "'Jost', sans-serif"}}>Include country code. Used for booking notifications.</p>
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="e.g. Bergen, Norway" style={inputStyle}/>
              </div>
            </div>
          </div>

          <div style={{borderTop: "1px solid #E2D5C8", paddingTop: "24px"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>YOUR PHOTOGRAPHY</p>
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              <div>
                <label style={labelStyle}>Photography categories (select all that apply)</label>
                <div style={{display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: otherChecked ? "10px" : "0"}}>
                  {CATEGORIES.map(cat => {
                    const sel = selectedCategories.includes(cat);
                    return (
                      <button key={cat} type="button"
                        onClick={() => setSelectedCategories(prev => sel ? prev.filter(c => c !== cat) : [...prev, cat])}
                        style={{padding: "7px 16px", borderRadius: "999px", border: `1px solid ${sel ? "#C8622A" : "#E2D5C8"}`, backgroundColor: sel ? "#C8622A" : "#FDFBF8", color: sel ? "#FDFBF8" : "#7A5C44", fontSize: "12px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: sel ? "500" : "400"}}
                      >{cat}</button>
                    );
                  })}
                  <button type="button"
                    onClick={() => { setOtherChecked(!otherChecked); if (otherChecked) setOtherCategory(""); }}
                    style={{padding: "7px 16px", borderRadius: "999px", border: `1px solid ${otherChecked ? "#C8622A" : "#E2D5C8"}`, backgroundColor: otherChecked ? "#C8622A" : "#FDFBF8", color: otherChecked ? "#FDFBF8" : "#7A5C44", fontSize: "12px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: otherChecked ? "500" : "400"}}
                  >Other</button>
                </div>
                {otherChecked && (
                  <input type="text" value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} placeholder="Describe your specialty..." style={inputStyle} />
                )}
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
                <div style={{display: "flex", alignItems: "center", border: "1px solid #E2D5C8", borderRadius: "8px", overflow: "hidden"}}>
                  <span style={{padding: "12px 16px", backgroundColor: "#F5EFE4", color: "#C8622A", fontSize: "13px", borderRight: "1px solid #E2D5C8", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>@</span>
                  <input type="text" value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 16px", fontSize: "13px", color: "#1A0E06", backgroundColor: "#FDFBF8", fontFamily: "'Jost', sans-serif"}}/>
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

          <div style={{borderTop: "1px solid #E2D5C8", paddingTop: "24px"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ABOUT YOU</p>
            <div>
              <label style={labelStyle}>Tell us about yourself and your photography style *</label>
              <textarea
                value={form.about}
                onChange={(e) => setForm({...form, about: e.target.value})}
                placeholder="Tell us about your experience, your photography style, the kind of clients you work with and why you want to join Lomissa..."
                maxLength={500}
                rows={6}
                style={{...inputStyle, resize: "none"}}
              />
              <p style={{fontSize: "11px", color: form.about.length > 450 ? "#C8622A" : "#DDD0C0", margin: "6px 0 0", textAlign: "right", fontFamily: "'Jost', sans-serif"}}>{form.about.length}/500</p>
            </div>
          </div>

          {error && (
            <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca"}}>
              <p style={{fontSize: "13px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "16px", border: "none", borderRadius: "999px", cursor: saving ? "default" : "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", opacity: saving ? 0.7 : 1}}
          >
            {saving ? "Submitting application…" : "Submit application"}
          </button>

          <p style={{fontSize: "12px", color: "#DDD0C0", textAlign: "center", margin: "0", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>
            By applying you agree to Lomissa's terms. We review every application manually and will contact you within 3 business days.
          </p>

        </div>
      </div>

      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}
