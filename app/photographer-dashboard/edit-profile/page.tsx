"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    specialty: "",
    location: "",
    price: "",
    instagram: "",
    website: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
      } else {
        setUser(user);
        const meta = user.user_metadata;
        setForm({
          name: meta?.name || "",
          bio: meta?.bio || "",
          specialty: meta?.specialty || "",
          location: meta?.location || "",
          price: meta?.price || "",
          instagram: meta?.instagram || "",
          website: meta?.website || "",
        });
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.auth.updateUser({
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
    const { data: existing } = await supabase
      .from("photographers")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (existing) {
      await supabase.from("photographers").update({
        name: form.name,
        bio: form.bio,
        specialty: form.specialty,
        location: form.location,
        price: form.price,
        instagram: form.instagram,
        website: form.website,
      }).eq("user_id", user.id);
    } else {
      await supabase.from("photographers").insert({
        user_id: user.id,
        name: form.name,
        bio: form.bio,
        specialty: form.specialty,
        location: form.location,
        price: form.price,
        instagram: form.instagram,
        website: form.website,
      });
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

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <a href="/photographer-dashboard" style={{fontSize: "12px", color: "#888", textDecoration: "none", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px"}}>
          Back to dashboard
        </a>
      </nav>

      <div style={{maxWidth: "680px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Your profile</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
            Edit your profile
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>A complete profile gets 3x more bookings</p>
        </div>

        {/* Profile preview */}
        <div style={{backgroundColor: "#FDF8F5", borderRadius: "12px", padding: "20px", border: "1px solid #f0e8e0", marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px"}}>
          <div style={{width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#fff", border: "1px solid #f0e8e0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
            <span style={{fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "700", color: "#C4907A"}}>{form.name?.[0] || "?"}</span>
          </div>
          <div>
            <p style={{fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px"}}>{form.name || "Your name"}</p>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 2px"}}>{form.specialty || "Your specialty"}</p>
            <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{form.location || "Your location"}</p>
          </div>
        </div>

        {/* Form */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: "24px"}}>

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
              rows={5}
              style={{...inputStyle, resize: "none"}}
            />
            <p style={{fontSize: "11px", color: form.bio.length > 450 ? "#C4907A" : "#aaa", margin: "6px 0 0", textAlign: "right"}}>{form.bio.length}/500</p>
          </div>

          <div>
            <label style={labelStyle}>Instagram handle</label>
            <div style={{display: "flex", alignItems: "center", border: "1px solid #e5e5e5", borderRadius: "8px", overflow: "hidden"}}>
              <span style={{padding: "12px 16px", backgroundColor: "#FAFAF8", color: "#C4907A", fontSize: "13px", borderRight: "1px solid #e5e5e5", flexShrink: 0}}>@</span>
              <input type="text" value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 16px", fontSize: "13px", color: "#1a1a1a", backgroundColor: "#fff"}}/>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Website</label>
            <input type="text" value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder="https://yourwebsite.com" style={inputStyle}/>
          </div>

          {saved && (
            <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", textAlign: "center"}}>
              <p style={{fontSize: "13px", color: "#15803d", margin: "0"}}>Profile saved successfully ✓</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{width: "100%", backgroundColor: "#C4907A", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600"}}
          >
            {saving ? "Saving..." : "Save profile"}
          </button>

        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>Lomissa</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}