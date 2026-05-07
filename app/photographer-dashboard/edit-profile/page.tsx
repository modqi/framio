"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    name: "",
    bio: "",
    specialty: "",
    location: "",
    price: "",
    instagram: "",
    website: "",
    photos_delivered: "",
    delivery_time: "",
    copyright_ownership: "",
    editing_style: "",
    revisions_included: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
      } else if (user.user_metadata?.role !== "photographer") {
        window.location.href = "/dashboard";
      } else {
        setUser(user);
        const meta = user.user_metadata;
        const { data: row } = await supabase
          .from("photographers")
          .select("photos_delivered, delivery_time, copyright_ownership, editing_style, revisions_included")
          .eq("user_id", user.id)
          .single();
        setForm({
          name: meta?.name || "",
          bio: meta?.bio || "",
          specialty: meta?.specialty || "",
          location: meta?.location || "",
          price: meta?.price || "",
          instagram: meta?.instagram || "",
          website: meta?.website || "",
          photos_delivered: row?.photos_delivered || "",
          delivery_time: row?.delivery_time || "",
          copyright_ownership: row?.copyright_ownership || "",
          editing_style: row?.editing_style || "",
          revisions_included: row?.revisions_included || "",
        });
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        bio: form.bio,
        specialty: form.specialty,
        location: form.location,
        price: form.price,
        instagram: form.instagram,
        website: form.website,
        name: form.name,
      }
    });
    if (authError) {
      setSaveError("Failed to save profile. Please try again.");
      setSaving(false);
      return;
    }
    const { data: existing } = await supabase
      .from("photographers")
      .select("id")
      .eq("user_id", user.id)
      .single();
    const dbPayload = {
      name: form.name, bio: form.bio, specialty: form.specialty,
      location: form.location, price: form.price,
      instagram: form.instagram, website: form.website,
      photos_delivered: form.photos_delivered || null,
      delivery_time: form.delivery_time || null,
      copyright_ownership: form.copyright_ownership || null,
      editing_style: form.editing_style || null,
      revisions_included: form.revisions_included || null,
    };
    const { error: dbError } = existing
      ? await supabase.from("photographers").update(dbPayload).eq("user_id", user.id)
      : await supabase.from("photographers").insert({ user_id: user.id, ...dbPayload });
    if (dbError) {
      setSaveError("Profile metadata saved but failed to update public profile. Please try again.");
      setSaving(false);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
      </div>
    );
  }

  const inputStyle = {
    width: "100%",
    border: "1px solid #E4D8C4",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    outline: "none",
    color: "#1C1009",
    backgroundColor: "#FAF7F1",
    boxSizing: "border-box" as const,
    fontFamily: "'Jost', sans-serif",
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#7A5235",
    display: "block",
    marginBottom: "8px",
    letterSpacing: "0.05em",
    fontFamily: "'Jost', sans-serif",
  };

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/photographer-dashboard" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>← Dashboard</a>
      </nav>

      <div style={{maxWidth: "680px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>YOUR PROFILE</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "400", color: "#1C1009", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            Edit your profile
          </h1>
          <p style={{fontSize: "14px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>A complete profile gets 3x more bookings</p>
        </div>

        {/* Profile preview */}
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "20px", border: "1px solid #E4D8C4", marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px"}}>
          <div style={{width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#F5EFE4", border: "1px solid #E4D8C4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
            <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", fontWeight: "400", color: "#B85528"}}>{form.name?.[0] || "?"}</span>
          </div>
          <div>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1C1009", margin: "0 0 2px"}}>{form.name || "Your name"}</p>
            <p style={{fontSize: "12px", color: "#B85528", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{form.specialty || "Your specialty"}</p>
            <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{form.location || "Your location"}</p>
          </div>
        </div>

        {/* Form */}
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4", display: "flex", flexDirection: "column", gap: "24px"}}>

          <div>
            <label style={labelStyle}>Full name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Your full name" style={inputStyle}/>
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="e.g. Bergen, Norway" style={inputStyle}/>
          </div>

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
            <label style={labelStyle}>Starting price</label>
            <input type="text" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="e.g. 3,200 NOK per session" style={inputStyle}/>
          </div>

          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({...form, bio: e.target.value})}
              placeholder="Tell clients about yourself, your style and your experience..."
              maxLength={500}
              rows={5}
              style={{...inputStyle, resize: "none"}}
            />
            <p style={{fontSize: "11px", color: form.bio.length > 450 ? "#B85528" : "#C3AB88", margin: "6px 0 0", textAlign: "right", fontFamily: "'Jost', sans-serif"}}>{form.bio.length}/500</p>
          </div>

          <div>
            <label style={labelStyle}>Instagram handle</label>
            <div style={{display: "flex", alignItems: "center", border: "1px solid #E4D8C4", borderRadius: "8px", overflow: "hidden"}}>
              <span style={{padding: "12px 16px", backgroundColor: "#F5EFE4", color: "#B85528", fontSize: "13px", borderRight: "1px solid #E4D8C4", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>@</span>
              <input type="text" value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 16px", fontSize: "13px", color: "#1C1009", backgroundColor: "#FAF7F1", fontFamily: "'Jost', sans-serif"}}/>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Website</label>
            <input type="text" value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder="https://yourwebsite.com" style={inputStyle}/>
          </div>

          {/* Divider */}
          <div style={{borderTop: "1px solid #E4D8C4", paddingTop: "24px"}}>
            <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>SESSION TERMS</p>
            <p style={{fontSize: "12px", color: "#9E7250", margin: "0 0 20px", fontFamily: "'Jost', sans-serif"}}>Shown to clients on your profile before they book. Leave blank to hide.</p>
          </div>

          <div>
            <label style={labelStyle}>Photos delivered</label>
            <input
              type="text"
              value={form.photos_delivered}
              onChange={(e) => setForm({...form, photos_delivered: e.target.value})}
              placeholder="e.g. 30–50 fully edited photos"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Delivery time</label>
            <input
              type="text"
              value={form.delivery_time}
              onChange={(e) => setForm({...form, delivery_time: e.target.value})}
              placeholder="e.g. 2 weeks after the session"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Copyright ownership</label>
            <select
              value={form.copyright_ownership}
              onChange={(e) => setForm({...form, copyright_ownership: e.target.value})}
              style={inputStyle}
            >
              <option value="">Select copyright policy</option>
              <option value="Photographer retains copyright, client gets personal use license">
                Photographer retains copyright, client gets personal use license
              </option>
              <option value="Client receives full copyright after payment">
                Client receives full copyright after payment
              </option>
              <option value="Photographer keeps portfolio rights, client gets full usage rights">
                Photographer keeps portfolio rights, client gets full usage rights
              </option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Editing style</label>
            <input
              type="text"
              value={form.editing_style}
              onChange={(e) => setForm({...form, editing_style: e.target.value})}
              placeholder="e.g. Natural and light, film-inspired"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Revisions included</label>
            <input
              type="text"
              value={form.revisions_included}
              onChange={(e) => setForm({...form, revisions_included: e.target.value})}
              placeholder="e.g. 2 rounds of revisions included"
              style={inputStyle}
            />
          </div>

          {saveError && (
            <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
              <p style={{fontSize: "13px", color: "#cc0000", margin: "0"}}>{saveError}</p>
            </div>
          )}
          {saved && (
            <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", textAlign: "center"}}>
              <p style={{fontSize: "13px", color: "#15803d", margin: "0"}}>Profile saved successfully ✓</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{width: "100%", backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}
          >
            {saving ? "Saving..." : "Save profile"}
          </button>

        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}