"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";
import GlobeModal from "../../components/GlobeModal";
import { useTranslations } from "next-intl";
import { CATEGORIES, CATEGORY_KEY } from "../../../lib/categories";

export default function EditProfile() {
  const t = useTranslations("EditProfile");
  const tCat = useTranslations("Categories");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    location: "",
    instagram: "",
    website: "",
    phone_number: "",
    cancellation_policy: "moderate",
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
          .select("cancellation_policy, delivery_time, copyright_ownership, editing_style, revisions_included, specialities, profile_photo, phone_number")
          .eq("user_id", user.id)
          .single();
        if (row?.profile_photo) setProfilePhoto(row.profile_photo);
        setForm({
          name: meta?.name || "",
          bio: meta?.bio || "",
          location: meta?.location || "",
          instagram: meta?.instagram || "",
          website: meta?.website || "",
          phone_number: row?.phone_number || "",
          cancellation_policy: row?.cancellation_policy || "moderate",
          delivery_time: row?.delivery_time || "",
          copyright_ownership: row?.copyright_ownership || "",
          editing_style: row?.editing_style || "",
          revisions_included: row?.revisions_included || "",
        });
        const loaded: string[] = row?.specialities || [];
        setSelectedCategories(loaded.filter((s: string) => (CATEGORIES as readonly string[]).includes(s)));
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    const finalSpecialities = [...selectedCategories];
    const primarySpecialty = finalSpecialities[0] || "";
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        bio: form.bio,
        specialty: primarySpecialty,
        location: form.location,
        instagram: form.instagram,
        website: form.website,
        name: form.name,
      }
    });
    if (authError) {
      setSaveError(t("saveFailed"));
      setSaving(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/update-photographer-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        name: form.name,
        bio: form.bio,
        specialty: primarySpecialty || null,
        specialities: finalSpecialities,
        location: form.location,
        instagram: form.instagram,
        website: form.website,
        phone_number: form.phone_number || null,
        cancellation_policy: form.cancellation_policy,
        delivery_time: form.delivery_time || null,
        copyright_ownership: form.copyright_ownership || null,
        editing_style: form.editing_style || null,
        revisions_included: form.revisions_included || null,
        profile_photo: profilePhoto || null,
      }),
    });
    if (!res.ok) {
      setSaveError(t("updateFailed"));
      setSaving(false);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError("");
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError(t("photo.tooLarge"));
      return;
    }
    setUploadingPhoto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.url) throw new Error(data.error || "Upload failed");
      setProfilePhoto(data.url);
    } catch {
      setPhotoError(t("photo.uploadFailed"));
    }
    setUploadingPhoto(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p style={{fontSize: "13px", color: "#C4907A"}}>{t("loading")}</p>
      </div>
    );
  }

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

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-3"><GlobeModal /><a href="/photographer-dashboard" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("nav.dashboard")}</a></div>
      </nav>

      <div style={{maxWidth: "680px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {t("heading")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("description")}</p>
        </div>

        {/* Profile photo */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "24px", border: "1px solid #E2D5C8", marginBottom: "32px", display: "flex", alignItems: "center", gap: "20px"}}>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{display: "none"}}
            onChange={handlePhotoUpload}
          />
          <div style={{position: "relative", flexShrink: 0, width: "80px", height: "80px"}}>
            <div
              onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
              style={{width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#F5EFE4", border: "2px dashed #E2D5C8", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingPhoto ? "default" : "pointer", overflow: "hidden"}}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" style={{width: "100%", height: "100%", objectFit: "cover"}}/>
              ) : uploadingPhoto ? (
                <span style={{fontSize: "11px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", textAlign: "center", padding: "4px"}}>{t("photo.uploading")}</span>
              ) : (
                <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#C8622A"}}>{form.name?.[0] || "?"}</span>
              )}
            </div>
            {profilePhoto && !uploadingPhoto && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setProfilePhoto(null); setPhotoError(""); }}
                title="Remove photo"
                style={{position: "absolute", top: "0", right: "0", width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#1A0E06", border: "2px solid #FDFBF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: "0"}}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          <div>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{form.name || "Your name"}</p>
            <button
              type="button"
              onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              style={{fontSize: "12px", color: "#C8622A", background: "none", border: "none", padding: "0", cursor: uploadingPhoto ? "default" : "pointer", fontFamily: "'Jost', sans-serif", textDecoration: "underline"}}
            >
              {uploadingPhoto ? t("photo.uploading") : profilePhoto ? t("photo.change") : t("photo.upload")}
            </button>
            <p style={{fontSize: "11px", color: "#DDD0C0", margin: "4px 0 0", fontFamily: "'Jost', sans-serif"}}>{t("photo.hint")}</p>
          </div>
        </div>

        {photoError && (
          <p style={{fontSize: "12px", color: "#dc2626", margin: "-20px 0 16px", fontFamily: "'Jost', sans-serif"}}>
            {photoError}
          </p>
        )}

        {/* Form */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", display: "flex", flexDirection: "column", gap: "24px"}}>

          <div>
            <label style={labelStyle}>{t("form.fullName")}</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder={t("form.fullNamePlaceholder")} style={inputStyle}/>
          </div>

          <div>
            <label style={labelStyle}>{t("form.location")}</label>
            <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder={t("form.locationPlaceholder")} style={inputStyle}/>
          </div>

          <div>
            <label style={labelStyle}>{t("form.categories")}</label>
            <div style={{display: "flex", flexWrap: "wrap", gap: "8px"}}>
              {CATEGORIES.map(cat => {
                const sel = selectedCategories.includes(cat);
                return (
                  <button key={cat} type="button"
                    onClick={() => setSelectedCategories(prev => sel ? prev.filter(c => c !== cat) : [...prev, cat])}
                    style={{padding: "7px 16px", borderRadius: "999px", border: `1px solid ${sel ? "#C8622A" : "#E2D5C8"}`, backgroundColor: sel ? "#C8622A" : "#FDFBF8", color: sel ? "#FDFBF8" : "#7A5C44", fontSize: "12px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: sel ? "500" : "400"}}
                  >{tCat(CATEGORY_KEY[cat])}</button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t("form.bio")}</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({...form, bio: e.target.value})}
              placeholder={t("form.bioPlaceholder")}
              maxLength={500}
              rows={5}
              style={{...inputStyle, resize: "none"}}
            />
            <p style={{fontSize: "11px", color: form.bio.length > 450 ? "#C8622A" : "#DDD0C0", margin: "6px 0 0", textAlign: "right", fontFamily: "'Jost', sans-serif"}}>{form.bio.length}/500</p>
          </div>

          <div>
            <label style={labelStyle}>{t("form.instagram")}</label>
            <div style={{display: "flex", alignItems: "center", border: "1px solid #E2D5C8", borderRadius: "8px", overflow: "hidden"}}>
              <span style={{padding: "12px 16px", backgroundColor: "#F5EFE4", color: "#C8622A", fontSize: "13px", borderRight: "1px solid #E2D5C8", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>@</span>
              <input type="text" value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})} placeholder="yourhandle" style={{flex: 1, border: "none", outline: "none", padding: "12px 16px", fontSize: "13px", color: "#1A0E06", backgroundColor: "#FDFBF8", fontFamily: "'Jost', sans-serif"}}/>
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t("form.website")}</label>
            <input type="text" value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder={t("form.websitePlaceholder")} style={inputStyle}/>
          </div>

          <div>
            <label style={labelStyle}>{t("form.phone")}</label>
            <input type="tel" value={form.phone_number} onChange={(e) => setForm({...form, phone_number: e.target.value})} placeholder={t("form.phonePlaceholder")} style={inputStyle}/>
            <p style={{fontSize: "11px", color: "#7A5C44", margin: "8px 0 0", fontFamily: "'Jost', sans-serif"}}>{t("form.phoneHelper")}</p>
          </div>

          {/* Cancellation policy */}
          <div style={{borderTop: "1px solid #E2D5C8", paddingTop: "24px"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("cancellation.label")}</p>
            <p style={{fontSize: "12px", color: "#7A5C44", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>{t("cancellation.description")}</p>
            <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
              {[
                { value: "flexible", label: t("cancellation.flexibleLabel"), desc: t("cancellation.flexibleDesc") },
                { value: "moderate", label: t("cancellation.moderateLabel"), desc: t("cancellation.moderateDesc") },
                { value: "strict", label: t("cancellation.strictLabel"), desc: t("cancellation.strictDesc") },
              ].map((opt) => (
                <label key={opt.value} style={{display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", border: `1px solid ${form.cancellation_policy === opt.value ? "#C8622A" : "#E2D5C8"}`, borderRadius: "8px", cursor: "pointer", backgroundColor: form.cancellation_policy === opt.value ? "#FBF0EA" : "#FDFBF8"}}>
                  <input
                    type="radio"
                    name="cancellation_policy"
                    value={opt.value}
                    checked={form.cancellation_policy === opt.value}
                    onChange={() => setForm({...form, cancellation_policy: opt.value})}
                    style={{marginTop: "2px", accentColor: "#C8622A"}}
                  />
                  <div>
                    <p style={{fontSize: "13px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{opt.label}</p>
                    <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Session terms */}
          <div style={{borderTop: "1px solid #E2D5C8", paddingTop: "24px"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("sessionTerms.label")}</p>
            <p style={{fontSize: "12px", color: "#7A5C44", margin: "0 0 20px", fontFamily: "'Jost', sans-serif"}}>{t("sessionTerms.description")}</p>
          </div>

          <div>
            <label style={labelStyle}>{t("sessionTerms.deliveryTime")}</label>
            <select
              value={form.delivery_time}
              onChange={(e) => setForm({...form, delivery_time: e.target.value})}
              style={inputStyle}
            >
              <option value="">{t("sessionTerms.deliveryTimePlaceholder")}</option>
              <option value="Within 3 days">Within 3 days</option>
              <option value="Within 5 days">Within 5 days</option>
              <option value="Within 1 week">Within 1 week</option>
              <option value="Within 2 weeks">Within 2 weeks</option>
              <option value="Within 3 weeks">Within 3 weeks</option>
              <option value="Within 1 month">Within 1 month</option>
              <option value="Within 2 months">Within 2 months</option>
              <option value="Within 3 months">Within 3 months</option>
            </select>
            <p style={{fontSize: "11px", color: "#7A5C44", margin: "8px 0 0", fontFamily: "'Jost', sans-serif"}}>{t("sessionTerms.deliveryTimeHelper")}</p>
          </div>

          <div>
            <label style={labelStyle}>{t("sessionTerms.copyright")}</label>
            <select
              value={form.copyright_ownership}
              onChange={(e) => setForm({...form, copyright_ownership: e.target.value})}
              style={inputStyle}
            >
              <option value="">{t("sessionTerms.copyrightPlaceholder")}</option>
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
            <label style={labelStyle}>{t("sessionTerms.editingStyle")}</label>
            <input
              type="text"
              value={form.editing_style}
              onChange={(e) => setForm({...form, editing_style: e.target.value})}
              placeholder={t("sessionTerms.editingStylePlaceholder")}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t("sessionTerms.revisions")}</label>
            <input
              type="text"
              value={form.revisions_included}
              onChange={(e) => setForm({...form, revisions_included: e.target.value})}
              placeholder={t("sessionTerms.revisionsPlaceholder")}
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
              <p style={{fontSize: "13px", color: "#15803d", margin: "0"}}>{t("saved")}</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}
          >
            {saving ? t("saving") : t("save")}
          </button>

        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}