"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";
import GlobeModal from "../../components/GlobeModal";
import { useCurrency } from "../../../lib/currency-context";

const CATEGORIES = ["Weddings", "Portraits", "Family & Newborn", "Real Estate", "Products", "Events", "Lomissa"];
const BLANK_PKG = { name: "", duration: "", photos_delivered: "", price: "", description: "", category: "" };
const BLANK_ADDON = { name: "", price: "", unit: "flat fee" };

export default function ManagePackages() {
  const t = useTranslations("Packages");
  const { formatPrice } = useCurrency();
  const [photographerId, setPhotographerId] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgForm, setPkgForm] = useState(BLANK_PKG);
  const [savingPkg, setSavingPkg] = useState(false);
  const [pkgError, setPkgError] = useState("");
  const [confirmDeletePkg, setConfirmDeletePkg] = useState<string | null>(null);

  const [showAddonForm, setShowAddonForm] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonForm, setAddonForm] = useState(BLANK_ADDON);
  const [savingAddon, setSavingAddon] = useState(false);
  const [addonError, setAddonError] = useState("");
  const [confirmDeleteAddon, setConfirmDeleteAddon] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      if (user.user_metadata?.role !== "photographer") { window.location.href = "/dashboard"; return; }

      const { data: pgRow } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pgRow) { window.location.href = "/photographer-dashboard"; return; }
      setPhotographerId(pgRow.id);

      const [{ data: pkgs }, { data: ads }] = await Promise.all([
        supabase.from("photographer_packages").select("*").eq("photographer_id", pgRow.id).order("sort_order").order("created_at"),
        supabase.from("photographer_addons").select("*").eq("photographer_id", pgRow.id).order("sort_order").order("created_at"),
      ]);
      setPackages(pkgs || []);
      setAddons(ads || []);
      setLoading(false);
    };
    init();
  }, []);

  const openEditPkg = (pkg: any) => {
    setEditingPkgId(pkg.id);
    setPkgForm({ name: pkg.name, duration: pkg.duration, photos_delivered: String(pkg.photos_delivered), price: String(pkg.price), description: pkg.description || "", category: pkg.category || "" });
    setShowPkgForm(true);
    setPkgError("");
  };

  const cancelPkgForm = () => {
    setShowPkgForm(false);
    setEditingPkgId(null);
    setPkgForm(BLANK_PKG);
    setPkgError("");
  };

  const savePackage = async () => {
    if (!pkgForm.name.trim()) { setPkgError(t("errors.nameRequired")); return; }
    if (!pkgForm.duration.trim()) { setPkgError(t("errors.durationRequired")); return; }
    const photosNum = parseInt(pkgForm.photos_delivered);
    if (isNaN(photosNum) || photosNum <= 0) { setPkgError(t("errors.photosInvalid")); return; }
    const priceNum = parseInt(pkgForm.price);
    if (isNaN(priceNum) || priceNum <= 0) { setPkgError(t("errors.priceInvalid")); return; }
    if (!editingPkgId && packages.length >= 5) { setPkgError(t("errors.maxPackages")); return; }

    setSavingPkg(true);
    setPkgError("");

    const payload: any = {
      name: pkgForm.name.trim(),
      duration: pkgForm.duration.trim(),
      photos_delivered: photosNum,
      price: priceNum,
      description: pkgForm.description.trim() || null,
      category: pkgForm.category || null,
    };

    if (editingPkgId) {
      const { data, error } = await supabase
        .from("photographer_packages")
        .update(payload)
        .eq("id", editingPkgId)
        .select()
        .single();
      if (error || !data) { setPkgError(t("errors.saveFailed")); setSavingPkg(false); return; }
      setPackages(prev => prev.map(p => p.id === editingPkgId ? data : p));
    } else {
      payload.photographer_id = photographerId;
      payload.sort_order = packages.length;
      const { data, error } = await supabase
        .from("photographer_packages")
        .insert(payload)
        .select()
        .single();
      if (error || !data) { setPkgError(t("errors.saveFailed")); setSavingPkg(false); return; }
      setPackages(prev => [...prev, data]);
    }

    cancelPkgForm();
    setSavingPkg(false);
  };

  const deletePackage = async (id: string) => {
    await supabase.from("photographer_packages").delete().eq("id", id);
    setPackages(prev => prev.filter(p => p.id !== id));
    setConfirmDeletePkg(null);
  };

  const openEditAddon = (addon: any) => {
    setEditingAddonId(addon.id);
    setAddonForm({ name: addon.name, price: String(addon.price), unit: addon.unit });
    setShowAddonForm(true);
    setAddonError("");
  };

  const cancelAddonForm = () => {
    setShowAddonForm(false);
    setEditingAddonId(null);
    setAddonForm(BLANK_ADDON);
    setAddonError("");
  };

  const saveAddon = async () => {
    if (!addonForm.name.trim()) { setAddonError(t("errors.addonNameRequired")); return; }
    const priceNum = parseInt(addonForm.price);
    if (isNaN(priceNum) || priceNum <= 0) { setAddonError(t("errors.addonPriceInvalid")); return; }
    if (!addonForm.unit.trim()) { setAddonError(t("errors.addonUnitRequired")); return; }

    setSavingAddon(true);
    setAddonError("");

    const payload: any = {
      name: addonForm.name.trim(),
      price: priceNum,
      unit: addonForm.unit.trim(),
    };

    if (editingAddonId) {
      const { data, error } = await supabase
        .from("photographer_addons")
        .update(payload)
        .eq("id", editingAddonId)
        .select()
        .single();
      if (error || !data) { setAddonError(t("errors.addonSaveFailed")); setSavingAddon(false); return; }
      setAddons(prev => prev.map(a => a.id === editingAddonId ? data : a));
    } else {
      payload.photographer_id = photographerId;
      payload.sort_order = addons.length;
      const { data, error } = await supabase
        .from("photographer_addons")
        .insert(payload)
        .select()
        .single();
      if (error || !data) { setAddonError(t("errors.addonSaveFailed")); setSavingAddon(false); return; }
      setAddons(prev => [...prev, data]);
    }

    cancelAddonForm();
    setSavingAddon(false);
  };

  const deleteAddon = async (id: string) => {
    await supabase.from("photographer_addons").delete().eq("id", id);
    setAddons(prev => prev.filter(a => a.id !== id));
    setConfirmDeleteAddon(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>{t("loading")}</p>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "10px 14px",
    fontSize: "13px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8",
    fontFamily: "'Jost', sans-serif", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "6px",
    fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em",
  };

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <GlobeModal />
          <a href="/photographer-dashboard" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("nav.dashboard")}</a>
        </div>
      </nav>

      <div style={{maxWidth: "720px", margin: "0 auto", padding: "48px 32px"}}>

        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {t("heading")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
            {t("description")}
          </p>
        </div>

        {/* ── PACKAGES ── */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", marginBottom: "24px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px"}}>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("packages.label")}</p>
              <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("packages.count", { count: packages.length } as any)}</p>
            </div>
            {packages.length < 5 && !showPkgForm && (
              <button
                onClick={() => { cancelPkgForm(); setShowPkgForm(true); }}
                style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "8px 20px", border: "none", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}
              >
                {t("packages.addButton")}
              </button>
            )}
          </div>

          {packages.length === 0 && !showPkgForm && (
            <div style={{textAlign: "center", padding: "32px 0", borderTop: "1px solid #E2D5C8"}}>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", color: "#DDD0C0", fontStyle: "italic", margin: "0 0 8px"}}>{t("packages.noPackages")}</p>
              <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("packages.noPackagesDesc")}</p>
            </div>
          )}

          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            {packages.map((pkg) => (
              <div key={pkg.id}>
                {editingPkgId === pkg.id && showPkgForm ? (
                  <PackageForm
                    form={pkgForm}
                    setForm={setPkgForm}
                    onSave={savePackage}
                    onCancel={cancelPkgForm}
                    saving={savingPkg}
                    error={pkgError}
                    inputStyle={inputStyle}
                    labelStyle={labelStyle}
                    isEdit
                  />
                ) : (
                  <div style={{border: "1px solid #E2D5C8", borderRadius: "10px", padding: "16px 20px", backgroundColor: "#FDFBF8"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px"}}>
                      <div style={{flex: 1}}>
                        <div style={{display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px"}}>
                          <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1A0E06", margin: "0"}}>{pkg.name}</p>
                          {pkg.category && <span style={{fontSize: "10px", color: "#C8622A", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", padding: "2px 8px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>{pkg.category}</span>}
                        </div>
                        <p style={{fontSize: "12px", color: "#7A5C44", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{pkg.duration} · {pkg.photos_delivered} photos</p>
                        {pkg.description && <p style={{fontSize: "12px", color: "#7A5C44", margin: "4px 0 0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>{pkg.description}</p>}
                      </div>
                      <div style={{textAlign: "right", flexShrink: 0}}>
                        <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1A0E06", margin: "0 0 8px"}}>{formatPrice(pkg.price)}</p>
                        <div style={{display: "flex", gap: "8px", justifyContent: "flex-end"}}>
                          <button onClick={() => openEditPkg(pkg)} style={{fontSize: "12px", color: "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("packages.edit")}</button>
                          {confirmDeletePkg === pkg.id ? (
                            <>
                              <button onClick={() => deletePackage(pkg.id)} style={{fontSize: "12px", color: "#FDFBF8", backgroundColor: "#dc2626", border: "none", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("packages.confirm")}</button>
                              <button onClick={() => setConfirmDeletePkg(null)} style={{fontSize: "12px", color: "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("packages.cancel")}</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmDeletePkg(pkg.id)} style={{fontSize: "12px", color: "#dc2626", background: "none", border: "1px solid #fce8e8", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("packages.delete")}</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showPkgForm && !editingPkgId && (
              <PackageForm
                form={pkgForm}
                setForm={setPkgForm}
                onSave={savePackage}
                onCancel={cancelPkgForm}
                saving={savingPkg}
                error={pkgError}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                isEdit={false}
              />
            )}
          </div>
        </div>

        {/* ── ADD-ONS ── */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px"}}>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("addons.label")}</p>
              <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("addons.description")}</p>
            </div>
            {!showAddonForm && (
              <button
                onClick={() => { cancelAddonForm(); setShowAddonForm(true); }}
                style={{backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "8px 20px", border: "none", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}
              >
                {t("addons.addButton")}
              </button>
            )}
          </div>

          {addons.length === 0 && !showAddonForm && (
            <div style={{textAlign: "center", padding: "24px 0", borderTop: "1px solid #E2D5C8"}}>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#DDD0C0", fontStyle: "italic", margin: "0"}}>{t("addons.noAddons")}</p>
            </div>
          )}

          <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
            {addons.map((addon) => (
              <div key={addon.id}>
                {editingAddonId === addon.id && showAddonForm ? (
                  <AddonForm
                    form={addonForm}
                    setForm={setAddonForm}
                    onSave={saveAddon}
                    onCancel={cancelAddonForm}
                    saving={savingAddon}
                    error={addonError}
                    inputStyle={inputStyle}
                    labelStyle={labelStyle}
                  />
                ) : (
                  <div style={{border: "1px solid #E2D5C8", borderRadius: "10px", padding: "12px 16px", backgroundColor: "#FDFBF8", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px"}}>
                    <div>
                      <p style={{fontSize: "14px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{addon.name}</p>
                      <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{formatPrice(addon.price)} · {addon.unit}</p>
                    </div>
                    <div style={{display: "flex", gap: "8px", flexShrink: 0}}>
                      <button onClick={() => openEditAddon(addon)} style={{fontSize: "12px", color: "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("addons.edit")}</button>
                      {confirmDeleteAddon === addon.id ? (
                        <>
                          <button onClick={() => deleteAddon(addon.id)} style={{fontSize: "12px", color: "#FDFBF8", backgroundColor: "#dc2626", border: "none", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("addons.confirm")}</button>
                          <button onClick={() => setConfirmDeleteAddon(null)} style={{fontSize: "12px", color: "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("addons.cancel")}</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDeleteAddon(addon.id)} style={{fontSize: "12px", color: "#dc2626", background: "none", border: "1px solid #fce8e8", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("addons.delete")}</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showAddonForm && !editingAddonId && (
              <AddonForm
                form={addonForm}
                setForm={setAddonForm}
                onSave={saveAddon}
                onCancel={cancelAddonForm}
                saving={savingAddon}
                error={addonError}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />
            )}
          </div>
        </div>

      </div>

      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>
    </main>
  );
}

function PackageForm({ form, setForm, onSave, onCancel, saving, error, inputStyle, labelStyle, isEdit }: any) {
  const t = useTranslations("Packages");
  return (
    <div style={{border: "1px solid #C8622A", borderRadius: "10px", padding: "20px", backgroundColor: "#FBF0EA"}}>
      <p style={{fontSize: "12px", color: "#C8622A", margin: "0 0 16px", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em"}}>
        {isEdit ? t("packageForm.editTitle") : t("packageForm.newTitle")}
      </p>
      <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>
        <div>
          <label style={labelStyle}>{t("packageForm.name")}</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f: any) => ({...f, name: e.target.value}))} placeholder={t("packageForm.namePlaceholder")} style={inputStyle} />
        </div>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
          <div>
            <label style={labelStyle}>{t("packageForm.duration")}</label>
            <input type="text" value={form.duration} onChange={(e) => setForm((f: any) => ({...f, duration: e.target.value}))} placeholder={t("packageForm.durationPlaceholder")} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t("packageForm.photosDelivered")}</label>
            <input type="number" min="1" value={form.photos_delivered} onChange={(e) => setForm((f: any) => ({...f, photos_delivered: e.target.value}))} placeholder={t("packageForm.photosPlaceholder")} style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>{t("packageForm.price")}</label>
          <input type="number" min="1" value={form.price} onChange={(e) => setForm((f: any) => ({...f, price: e.target.value}))} placeholder={t("packageForm.pricePlaceholder")} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t("packageForm.description")}</label>
          <input type="text" value={form.description} onChange={(e) => setForm((f: any) => ({...f, description: e.target.value}))} placeholder={t("packageForm.descriptionPlaceholder")} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t("packageForm.category")}</label>
          <select value={form.category} onChange={(e) => setForm((f: any) => ({...f, category: e.target.value}))} style={inputStyle}>
            <option value="">{t("packageForm.noCategory")}</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        {error && <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>}
        <div style={{display: "flex", gap: "10px"}}>
          <button onClick={onSave} disabled={saving} style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "10px 24px", border: "none", borderRadius: "999px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: saving ? 0.7 : 1}}>
            {saving ? t("packageForm.saving") : isEdit ? t("packageForm.saveChanges") : t("packageForm.addPackage")}
          </button>
          <button onClick={onCancel} style={{fontSize: "13px", color: "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "10px 24px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("packageForm.cancel")}</button>
        </div>
      </div>
    </div>
  );
}

function AddonForm({ form, setForm, onSave, onCancel, saving, error, inputStyle, labelStyle }: any) {
  const t = useTranslations("Packages");
  return (
    <div style={{border: "1px solid #1A0E06", borderRadius: "10px", padding: "20px", backgroundColor: "#F5EFE4"}}>
      <p style={{fontSize: "12px", color: "#1A0E06", margin: "0 0 16px", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em"}}>{t("addonForm.title")}</p>
      <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>
        <div>
          <label style={labelStyle}>{t("addonForm.name")}</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f: any) => ({...f, name: e.target.value}))} placeholder={t("addonForm.namePlaceholder")} style={inputStyle} />
        </div>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
          <div>
            <label style={labelStyle}>{t("addonForm.price")}</label>
            <input type="number" min="1" value={form.price} onChange={(e) => setForm((f: any) => ({...f, price: e.target.value}))} placeholder={t("addonForm.pricePlaceholder")} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t("addonForm.unit")}</label>
            <input type="text" value={form.unit} onChange={(e) => setForm((f: any) => ({...f, unit: e.target.value}))} placeholder={t("addonForm.unitPlaceholder")} style={inputStyle} />
          </div>
        </div>
        {error && <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>}
        <div style={{display: "flex", gap: "10px"}}>
          <button onClick={onSave} disabled={saving} style={{backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "10px 24px", border: "none", borderRadius: "999px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: saving ? 0.7 : 1}}>
            {saving ? t("addonForm.saving") : t("addonForm.addExtra")}
          </button>
          <button onClick={onCancel} style={{fontSize: "13px", color: "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "10px 24px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>{t("addonForm.cancel")}</button>
        </div>
      </div>
    </div>
  );
}
