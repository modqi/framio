"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";
import { ReviewStarIcon } from "../../components/Icons";
import GlobeModal from "../../components/GlobeModal";
import AuthModal from "../../components/AuthModal";
import { useCurrency } from "../../../lib/currency-context";
import { useTranslations } from "../../../lib/i18n";
import { useLocale } from "../../../lib/locale-context";
import { CATEGORY_KEY } from "../../../lib/categories";

const TERM_VALUE_KEYS: Record<string, string> = {
  "Within 3 days": "terms.values.within3Days",
  "Within 5 days": "terms.values.within5Days",
  "Within 1 week": "terms.values.within1Week",
  "Within 2 weeks": "terms.values.within2Weeks",
  "Within 3 weeks": "terms.values.within3Weeks",
  "Within 1 month": "terms.values.within1Month",
  "Within 2 months": "terms.values.within2Months",
  "Within 3 months": "terms.values.within3Months",
  "Photographer retains copyright, client gets personal use license": "terms.values.copyrightRetained",
  "Client receives full copyright after payment": "terms.values.copyrightFull",
  "Photographer keeps portfolio rights, client gets full usage rights": "terms.values.copyrightPortfolio",
};

const UNIT_KEYS: Record<string, string> = {
  "hour": "booking.units.hour",
  "per hour": "booking.units.perHour",
  "per photo": "booking.units.perPhoto",
  "per person": "booking.units.perPerson",
  "per location": "booking.units.perLocation",
  "flat fee": "booking.units.flatFee",
};

export default function PhotographerProfile({ params }: { params: any }) {
  const { formatPrice } = useCurrency();
  const { locale } = useLocale();
  const t = useTranslations("Profile");
  const tCat = useTranslations("Categories");
  const translateTermValue = (v: string) => {
    const trimmed = v?.trim();
    const k = TERM_VALUE_KEYS[trimmed];
    console.log("[translateTermValue]", { v, trimmed, k });
    return k ? t(k as any) : (trimmed || v);
  };
  const translateUnit = (u: string) => { const k = UNIT_KEYS[u?.toLowerCase()]; return k ? t(k as any) : u; };
  const translateDuration = (d: string | null | undefined) => (d || "")
    .replace(/\bhours\b/gi, t("booking.durationHours" as any))
    .replace(/\bhour\b/gi, t("booking.durationHour" as any))
    .replace(/\bminutes\b/gi, t("booking.durationMinutes" as any))
    .replace(/\bminute\b/gi, t("booking.durationMinute" as any));
  const [photographer, setPhotographer] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");
  const [blockedDays, setBlockedDays] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const getData = async () => {
      // Next.js 16: params may be a Promise
      let id: string;
      if (typeof params?.then === "function") {
        const resolved = await params;
        id = resolved?.id;
      } else {
        id = params?.id;
      }
      // Fallback for safety
      if (!id) id = window.location.pathname.split("/").filter(Boolean).pop() ?? "";

      const [{ data: photographerData }, { data: { user } }] = await Promise.all([
        supabase
          .from("photographers")
          .select("*")
          .eq("id", id)
          .eq("stripe_onboarding_completed", true)
          .single(),
        supabase.auth.getUser(),
      ]);

      setAuthUser(user);
      setPhotographer(photographerData);

      if (photographerData) {
        const [
          { data: photoData },
          { data: availData },
          { data: reviewData },
          { data: pkgData },
          { data: addonData },
        ] = await Promise.all([
          supabase.from("portfolio_photos").select("*").eq("photographer_id", photographerData.user_id).order("order_index", { ascending: true }),
          supabase.from("availability").select("*").eq("photographer_id", photographerData.user_id).eq("is_available", false),
          supabase.from("reviews").select("*").eq("photographer_id", photographerData.user_id).order("created_at", { ascending: false }),
          supabase.from("photographer_packages").select("*").eq("photographer_id", photographerData.id).order("sort_order").order("created_at"),
          supabase.from("photographer_addons").select("*").eq("photographer_id", photographerData.id).order("sort_order").order("created_at"),
        ]);

        setPhotos(photoData || []);
        setBlockedDays(new Set<string>((availData || []).map((row: any) => row.date)));
        setReviews(reviewData || []);

        const pkgs = pkgData || [];
        const ads = addonData || [];
        setPackages(pkgs);
        setAddons(ads);
        if (pkgs.length > 0) setSelectedPackage(pkgs[0]);

        // Restore pending booking saved before login redirect
        const pending = localStorage.getItem("lomissa_pending_booking");
        if (pending) {
          try {
            const { date, pendingPackageId } = JSON.parse(pending);
            if (date) setSelectedDate(date);
            if (pendingPackageId) {
              const match = pkgs.find((p: any) => p.id === pendingPackageId);
              if (match) setSelectedPackage(match);
            }
            localStorage.removeItem("lomissa_pending_booking");
          } catch {}
        }
      }

      setLoading(false);
    };
    getData();
  }, []);

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${month}-${d}`;
  };

  const isPast = (day: number) => {
    const date = new Date(formatDate(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isBlocked = (day: number) => blockedDays.has(formatDate(day));

  const handleDayClick = (day: number) => {
    if (isPast(day) || isBlocked(day)) return;
    setSelectedDate(formatDate(day));
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const setAddonQuantity = (addonId: string, qty: number) => {
    setAddonQty(prev => ({ ...prev, [addonId]: Math.max(0, qty) }));
  };

  const total = selectedPackage
    ? selectedPackage.price + Object.entries(addonQty)
        .filter(([, qty]) => (qty as number) > 0)
        .reduce((sum, [id, qty]) => {
          const addon = addons.find((a: any) => a.id === id);
          return sum + (addon ? addon.price * (qty as number) : 0);
        }, 0)
    : 0;

  const selectedAddonsList = addons.filter(a => (addonQty[a.id] || 0) > 0);

  const handleBooking = async () => {
    if (!selectedPackage) { setError("Please select a package first."); return; }
    if (!selectedDate) { setError("Please select a date first."); return; }

    setBooking(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const id = window.location.pathname.split("/").pop();
      localStorage.setItem("lomissa_pending_booking", JSON.stringify({
        date: selectedDate,
        pendingPackageId: selectedPackage.id,
      }));
      window.location.href = `/login?redirect=/photographers/${id}`;
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          photographerName: photographer?.name,
          photographerEmail: photographer?.email || "",
          photographerId: photographer?.user_id,
          packageId: selectedPackage.id,
          addons: Object.entries(addonQty)
            .filter(([, qty]) => (qty as number) > 0)
            .map(([id, quantity]) => ({ id, quantity })),
          date: selectedDate,
          location,
          message,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError("Something went wrong. Please try again.");
        setBooking(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setBooking(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>Loading...</p>
    </div>
  );

  if (!photographer) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", color: "#1A0E06"}}>{t("notFound.heading")}</p>
      <a href="/photographers" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("notFound.back")}</a>
    </div>
  );

  const isAdmin = authUser?.user_metadata?.role === "admin";

  const days = getDaysInMonth();
  const monthName = `${t(`calendar.months.${currentMonth.getMonth()}` as any)} ${currentMonth.getFullYear()}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  const isAvailable = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }).some(dateStr => !blockedDays.has(dateStr));

  const minPackagePrice = packages.length > 0 ? Math.min(...packages.map(p => p.price)) : null;

  const policy = photographer.cancellation_policy || "moderate";
  const policyMap: Record<string, { label: string; desc: string; color: string; bg: string }> = {
    flexible: { label: t("policy.flexibleLabel"), desc: t("policy.flexibleDesc"), color: "#15803d", bg: "#f0fdf4" },
    moderate: { label: t("policy.moderateLabel"), desc: t("policy.moderateDesc"), color: "#C8622A", bg: "#FBF0EA" },
    strict:   { label: t("policy.strictLabel"),   desc: t("policy.strictDesc"),   color: "#dc2626", bg: "#fef2f2" },
  };
  const policyInfo = policyMap[policy] || policyMap.moderate;

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo size="sm" />
        <div className="flex items-center gap-2 sm:gap-4">
          <GlobeModal />
          {isAdmin ? (
            <a href="/admin" className="hidden sm:inline" style={{color: "#7A5C44", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("nav.backToAdmin")}</a>
          ) : (
            <a href="/photographers" className="hidden sm:inline" style={{color: "#7A5C44", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("nav.explore")}</a>
          )}
          {authUser ? (
            <>
              <span className="hidden sm:inline" style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
                {authUser.user_metadata?.name?.split(" ")[0] || "Hi"}
              </span>
              <a
                href={isAdmin ? "/admin" : authUser.user_metadata?.role === "photographer" ? "/photographer-dashboard" : "/dashboard"}
                style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", whiteSpace: "nowrap"}}
              >
                {isAdmin ? t("nav.adminPanel") : t("nav.myDashboard")}
              </a>
            </>
          ) : (
            <>
              <button onClick={() => { setAuthModalMode("login"); setAuthModalOpen(true); }} style={{background: "none", border: "none", cursor: "pointer", color: "#7A5C44", fontSize: "13px", fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap", padding: "0"}}>{t("nav.logIn")}</button>
              <button onClick={() => { setAuthModalMode("signup"); setAuthModalOpen(true); }} style={{backgroundColor: "#C8622A", color: "#FDFBF8", border: "none", cursor: "pointer", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", fontWeight: "500", whiteSpace: "nowrap"}}>{t("nav.signUp")}</button>
              <a href="/signup?role=photographer" className="hidden sm:inline" style={{border: "1px solid #C8622A", color: "#C8622A", backgroundColor: "transparent", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", whiteSpace: "nowrap"}}>{t("nav.joinAsPhotographer")}</a>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{backgroundColor: "#F5EFE4", padding: "48px", borderBottom: "1px solid #E2D5C8"}}>
        <div className="flex items-start justify-between flex-wrap gap-8">
          <div className="flex items-start gap-8">
            <div style={{width: "100px", height: "100px", backgroundColor: "#E2D5C8", backgroundImage: photographer.profile_photo ? "none" : "repeating-linear-gradient(-45deg,#E2D5C8,#E2D5C8 6px,#EDE3D1 6px,#EDE3D1 14px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", flexShrink: 0, overflow: "hidden"}}>
              {photographer.profile_photo
                ? <img src={photographer.profile_photo} alt={photographer.name} style={{width: "100%", height: "100%", objectFit: "cover"}}/>
                : <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "44px", fontWeight: "400", color: "#C8622A"}}>{photographer.name?.[0] || "?"}</span>
              }
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{photographer.specialty || "PHOTOGRAPHER"}</p>
              <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>{photographer.name}</h1>
              <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>{photographer.location}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}><svg viewBox="0 0 64 64" width="14" height="14" fill="none" style={{display:"inline-block",verticalAlign:"middle",marginRight:"3px"}}><circle cx="32" cy="32" r="9" fill="#C8622A"/><line x1="32" y1="18" x2="32" y2="10" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="46" y1="32" x2="54" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="42" y1="22" x2="48" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="22" x2="16" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/></svg>{photographer.rating || t("hero.new")}</span>
                {reviews.length > 0 && <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>({reviews.length} reviews)</span>}
                {isAvailable && <span style={{fontSize: "12px", color: "#FDFBF8", backgroundColor: "#C8622A", padding: "4px 12px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>{t("hero.available")}</span>}
                {photographer.instagram && (
                  <a href={`https://instagram.com/${photographer.instagram}`} target="_blank" style={{fontSize: "12px", color: "#C8622A", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>@{photographer.instagram}</a>
                )}
              </div>
              {(() => {
                const cats: string[] = photographer.specialities?.length > 0
                  ? photographer.specialities
                  : photographer.specialty ? [photographer.specialty] : [];
                return cats.length > 0 ? (
                  <div style={{display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px"}}>
                    {cats.map((cat: string) => (
                      <span key={cat} style={{fontSize: "11px", color: "#C8622A", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", padding: "3px 12px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>
                        {cat === "Other" && photographer.other_specialty
                          ? photographer.other_specialty
                          : CATEGORY_KEY[cat] ? tCat(CATEGORY_KEY[cat]) : cat}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
          {minPackagePrice !== null && (
            <div style={{textAlign: "right"}}>
              <p style={{fontSize: "12px", color: "#7A5C44", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("hero.from")}</p>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0", letterSpacing: "-0.02em"}}>{formatPrice(minPackagePrice)}</p>
            </div>
          )}
        </div>
      </section>

      {/* Bio */}
      {photographer.bio && (
        <section style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderBottom: "1px solid #E2D5C8"}}>
          <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#7A5C44", margin: "0", lineHeight: "1.8", maxWidth: "720px", fontStyle: "italic"}}>
            "{photographer.bio}"
          </p>
        </section>
      )}

      {/* Photographer terms */}
      {(photographer.delivery_time || photographer.copyright_ownership || photographer.editing_style || photographer.revisions_included) && (() => {
        const terms = [
          { icon: "⏱️", labelKey: "terms.deliveryTime",  value: photographer.delivery_time },
          { icon: "⚖️", labelKey: "terms.copyright",      value: photographer.copyright_ownership },
          { icon: "✦",  labelKey: "terms.editingStyle",   value: photographer.editing_style },
          { icon: "✏️", labelKey: "terms.revisions",      value: photographer.revisions_included },
        ].filter(t => t.value);
        return (
          <section style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderBottom: "1px solid #E2D5C8"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("whatsIncluded")}</p>
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px"}}>
              {terms.map((term) => (
                <div key={term.labelKey} style={{display: "flex", alignItems: "flex-start", gap: "12px"}}>
                  <div style={{width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F5EFE4", border: "1px solid #E2D5C8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0}}>{term.icon}</div>
                  <div>
                    <p style={{fontSize: "10px", color: "#C8622A", margin: "0 0 3px", letterSpacing: "0.1em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t(term.labelKey as any)}</p>
                    <p style={{fontSize: "13px", color: "#1A0E06", margin: "0", fontFamily: "'Jost', sans-serif", lineHeight: "1.5"}}>{translateTermValue(term.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      <div className="flex flex-col md:flex-row">

        {/* Left — portfolio & reviews */}
        <div style={{flex: 2, padding: "48px", borderRight: "1px solid #E2D5C8"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            {t("portfolio.label")} {photos.length > 0 && `— ${t("portfolio.photos", { count: photos.length })}`}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-12">
            {photos.length === 0 ? (
              [1,2,3,4,5,6].map((i) => (
                <div key={i} style={{aspectRatio: "1", backgroundColor: "#E2D5C8", backgroundImage: "repeating-linear-gradient(-45deg,#E2D5C8,#E2D5C8 6px,#EDE3D1 6px,#EDE3D1 14px)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <span style={{fontSize: "12px", color: "#DDD0C0", fontFamily: "'Jost', sans-serif"}}>Photo {i}</span>
                </div>
              ))
            ) : (
              photos.map((photo, index) => (
                <div key={photo.id} style={{aspectRatio: "1", borderRadius: "8px", overflow: "hidden", backgroundColor: "#E2D5C8", position: "relative"}}>
                  <Image src={photo.url} alt={`Portfolio photo ${index + 1}`} fill sizes="(max-width: 768px) 33vw, 20vw" style={{objectFit: "cover"}}/>
                </div>
              ))
            )}
          </div>

          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            {t("reviews.label")} {reviews.length > 0 && `— ${reviews.length}`}
          </p>
          <div style={{borderTop: "1px solid #E2D5C8", paddingTop: "20px"}}>
            {reviews.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#DDD0C0", fontStyle: "italic"}}>{t("reviews.noReviews")}</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {reviews.map((review: any) => (
                  <div key={review.id} style={{padding: "16px", border: "1px solid #E2D5C8", borderRadius: "12px", backgroundColor: "#FDFBF8"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px"}}>
                      <div>
                        <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "16px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px"}}>{(review.client_name && review.client_name !== "Anonymous") ? review.client_name : t("reviews.anonymous")}</p>
                        <p style={{fontSize: "11px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{new Date(review.created_at).toLocaleDateString(locale === "no" ? "nb-NO" : "en-US", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                      <div style={{display: "flex", gap: "2px"}}>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} style={{opacity: star <= review.rating ? 1 : 0.2, display: "inline-flex"}}><svg viewBox="0 0 64 64" width="14" height="14" fill="none"><circle cx="32" cy="32" r="9" fill="#C8622A"/><line x1="32" y1="18" x2="32" y2="10" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="46" y1="32" x2="54" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="42" y1="22" x2="48" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="22" x2="16" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/></svg></span>
                        ))}
                      </div>
                    </div>
                    <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", lineHeight: "1.7", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>"{review.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — booking form */}
        <div style={{flex: 1, padding: "48px"}}>
          <div style={{border: "1px solid #E2D5C8", borderRadius: "16px", padding: "32px", position: "sticky", top: "32px", boxShadow: "0 4px 24px rgba(28,16,9,0.08)", backgroundColor: "#FDFBF8"}}>
            {booked ? (
              <div className="text-center py-8">
                <div style={{marginBottom: "16px"}}><ReviewStarIcon size={56} color="#C8622A"/></div>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "26px", fontWeight: "400", color: "#1A0E06", margin: "0 0 12px"}}>{t("booking.requestedHeading")}</p>
                <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 8px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>{t("booking.requestedDesc", { name: photographer.name })}</p>
                <p style={{fontSize: "13px", color: "#C8622A", margin: "0 0 24px", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}>{selectedDate}</p>
                <a href="/dashboard" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("booking.viewBookings")}</a>
              </div>
            ) : packages.length === 0 ? (
              <div>
                <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("booking.title")}</p>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", color: "#DDD0C0", fontStyle: "italic", margin: "0 0 16px"}}>{t("booking.noPackagesTitle")}</p>
                <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 24px", fontFamily: "'Jost', sans-serif", lineHeight: "1.6"}}>{t("booking.noPackagesDesc")}</p>
                <a href="/messages" style={{display: "block", textAlign: "center", backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("booking.noPackagesAction")}</a>
              </div>
            ) : (
              <>
                <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("booking.title")}</p>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1A0E06", margin: "0 0 20px"}}>{photographer.name?.split(" ")[0]}</p>

                {/* Package selector */}
                <div style={{marginBottom: "20px"}}>
                  <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("booking.choosePackage")}</label>
                  <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                    {packages.map((pkg) => {
                      const selected = selectedPackage?.id === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg)}
                          style={{border: `1px solid ${selected ? "#C8622A" : "#E2D5C8"}`, borderRadius: "10px", padding: "14px 16px", textAlign: "left", cursor: "pointer", backgroundColor: selected ? "#FBF0EA" : "#FDFBF8", width: "100%", transition: "all 0.1s"}}
                        >
                          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px"}}>
                            <div style={{flex: 1}}>
                              <div style={{display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px"}}>
                                <p style={{fontSize: "13px", fontWeight: "500", color: "#1A0E06", margin: "0", fontFamily: "'Jost', sans-serif"}}>{pkg.name}</p>
                                {pkg.category && <span style={{fontSize: "10px", color: "#C8622A", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", padding: "1px 7px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>{pkg.category}</span>}
                              </div>
                              <p style={{fontSize: "11px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{translateDuration(pkg.duration)} · {t("booking.pkgPhotos", { count: pkg.photos_delivered } as any)}</p>
                              {pkg.description && <p style={{fontSize: "11px", color: "#7A5C44", margin: "4px 0 0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>{pkg.description}</p>}
                            </div>
                            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: selected ? "#C8622A" : "#1A0E06", margin: "0", flexShrink: 0}}>{formatPrice(pkg.price)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add-ons */}
                {addons.length > 0 && (
                  <div style={{marginBottom: "20px"}}>
                    <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("booking.addons")}</label>
                    <div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
                      {addons.map((addon) => {
                        const qty = addonQty[addon.id] || 0;
                        return (
                          <div key={addon.id} style={{border: `1px solid ${qty > 0 ? "#C8622A" : "#E2D5C8"}`, borderRadius: "8px", padding: "10px 12px", backgroundColor: qty > 0 ? "#FBF0EA" : "#FDFBF8", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", transition: "all 0.1s"}}>
                            <div style={{flex: 1}}>
                              <p style={{fontSize: "13px", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{addon.name}</p>
                              <p style={{fontSize: "11px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{formatPrice(addon.price)} {translateUnit(addon.unit)}</p>
                            </div>
                            {qty === 0 ? (
                              <button onClick={() => setAddonQuantity(addon.id, 1)} style={{fontSize: "12px", color: "#C8622A", background: "none", border: "1px solid #E8A97E", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif", flexShrink: 0}}>{t("booking.add")}</button>
                            ) : (
                              <div style={{display: "flex", alignItems: "center", gap: "8px", flexShrink: 0}}>
                                <button onClick={() => setAddonQuantity(addon.id, qty - 1)} style={{width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #E2D5C8", backgroundColor: "#FDFBF8", cursor: "pointer", fontSize: "14px", color: "#1A0E06", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", flexShrink: 0}}>−</button>
                                <span style={{fontSize: "13px", fontWeight: "500", color: "#1A0E06", fontFamily: "'Jost', sans-serif", minWidth: "16px", textAlign: "center"}}>{qty}</span>
                                <button onClick={() => setAddonQuantity(addon.id, qty + 1)} style={{width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #C8622A", backgroundColor: "#C8622A", cursor: "pointer", fontSize: "14px", color: "#FDFBF8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", flexShrink: 0}}>+</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Date picker */}
                <div style={{marginBottom: "16px"}}>
                  <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
                    {t("booking.selectDate")} {selectedDate && <span style={{color: "#C8622A", fontWeight: "600"}}>— {selectedDate}</span>}
                  </label>
                  <div style={{border: "1px solid #E2D5C8", borderRadius: "8px", padding: "12px", backgroundColor: "#FDFBF8"}}>
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={prevMonth} disabled={isCurrentMonth} style={{border: "none", backgroundColor: "transparent", cursor: isCurrentMonth ? "not-allowed" : "pointer", fontSize: "16px", color: isCurrentMonth ? "#DDD0C0" : "#7A5C44", padding: "4px 8px", opacity: isCurrentMonth ? 0.4 : 1}}>←</button>
                      <span style={{fontSize: "12px", fontWeight: "500", color: "#1A0E06", fontFamily: "'Jost', sans-serif"}}>{monthName}</span>
                      <button onClick={nextMonth} style={{border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "16px", color: "#7A5C44", padding: "4px 8px"}}>→</button>
                    </div>
                    <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px"}}>
                      {([
                        t("calendar.mon"), t("calendar.tue"), t("calendar.wed"), t("calendar.thu"),
                        t("calendar.fri"), t("calendar.sat"), t("calendar.sun"),
                      ] as string[]).map((d, i) => (
                        <div key={i} style={{textAlign: "center", fontSize: "10px", color: "#DDD0C0", padding: "2px", fontFamily: "'Jost', sans-serif"}}>{d}</div>
                      ))}
                    </div>
                    <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px"}}>
                      {days.map((day, index) => {
                        if (!day) return <div key={`e-${index}`}/>;
                        const dateStr = formatDate(day);
                        const past = isPast(day);
                        const blocked = isBlocked(day);
                        const sel = selectedDate === dateStr;
                        return (
                          <div key={day} onClick={() => handleDayClick(day)} style={{textAlign: "center", padding: "6px 2px", fontSize: "12px", borderRadius: "6px", cursor: past || blocked ? "not-allowed" : "pointer", backgroundColor: sel ? "#C8622A" : past || blocked ? "#F5EFE4" : "#FDFBF8", color: sel ? "#FDFBF8" : past || blocked ? "#DDD0C0" : "#1A0E06", textDecoration: blocked && !past ? "line-through" : "none", fontWeight: sel ? "500" : "400", border: sel ? "1px solid #C8622A" : "1px solid #E2D5C8", transition: "all 0.1s", fontFamily: "'Jost', sans-serif"}}>
                            {day}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display: "flex", gap: "12px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #E2D5C8"}}>
                      {[
                        {color: "#FDFBF8", border: "1px solid #E2D5C8", labelKey: "calendar.available"},
                        {color: "#F5EFE4", border: "none", labelKey: "calendar.unavailable"},
                        {color: "#C8622A", border: "none", labelKey: "calendar.selected"},
                      ].map(item => (
                        <div key={item.labelKey} style={{display: "flex", alignItems: "center", gap: "4px"}}>
                          <div style={{width: "8px", height: "8px", borderRadius: "2px", backgroundColor: item.color, border: item.border}}></div>
                          <span style={{fontSize: "10px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t(item.labelKey as any)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div style={{marginBottom: "16px"}}>
                  <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("booking.locationLabel")}</label>
                  <input type="text" placeholder={t("booking.locationPlaceholder")} value={location} onChange={(e) => setLocation(e.target.value)} style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", fontFamily: "'Jost', sans-serif"}}/>
                </div>

                {/* Message */}
                <div style={{marginBottom: "20px"}}>
                  <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("booking.messageLabel")}</label>
                  <textarea placeholder={t("booking.messagePlaceholder")} value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", resize: "none", fontFamily: "'Jost', sans-serif"}}/>
                </div>

                {/* Order summary */}
                {selectedPackage && (
                  <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "16px", marginBottom: "16px"}}>
                    <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 10px", letterSpacing: "0.1em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("booking.orderSummary")}</p>
                    <div style={{display: "flex", justifyContent: "space-between", marginBottom: "6px"}}>
                      <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{selectedPackage.name}</span>
                      <span style={{fontSize: "12px", color: "#1A0E06", fontFamily: "'Jost', sans-serif"}}>{formatPrice(selectedPackage.price)}</span>
                    </div>
                    {selectedAddonsList.map(addon => (
                      <div key={addon.id} style={{display: "flex", justifyContent: "space-between", marginBottom: "6px"}}>
                        <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{addon.name} ×{addonQty[addon.id]}</span>
                        <span style={{fontSize: "12px", color: "#1A0E06", fontFamily: "'Jost', sans-serif"}}>+{formatPrice(addon.price * addonQty[addon.id])}</span>
                      </div>
                    ))}
                    <div style={{borderTop: "1px solid #E2D5C8", marginTop: "8px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                      <span style={{fontSize: "13px", fontWeight: "500", color: "#1A0E06", fontFamily: "'Jost', sans-serif"}}>{t("booking.total")}</span>
                      <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1A0E06"}}>{formatPrice(total)}</span>
                    </div>
                  </div>
                )}

                {/* Cancellation policy */}
                <div style={{backgroundColor: policyInfo.bg, borderRadius: "8px", padding: "12px 14px", marginBottom: "16px"}}>
                  <p style={{fontSize: "11px", fontWeight: "600", color: policyInfo.color, margin: "0 0 2px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{policyInfo.label.toUpperCase()}</p>
                  <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{policyInfo.desc}</p>
                </div>

                {error && (
                  <div style={{marginBottom: "16px", padding: "12px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                    <p style={{fontSize: "12px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={booking || !selectedDate || !selectedPackage}
                  style={{width: "100%", backgroundColor: selectedDate && selectedPackage ? "#C8622A" : "#E2D5C8", color: selectedDate && selectedPackage ? "#FDFBF8" : "#DDD0C0", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: selectedDate && selectedPackage ? "pointer" : "not-allowed", fontWeight: "500", marginBottom: "12px", transition: "all 0.2s", fontFamily: "'Jost', sans-serif", boxShadow: selectedDate && selectedPackage ? "0 4px 20px rgba(184,85,40,0.3)" : "none"}}
                >
                  {booking ? t("booking.redirecting") : selectedDate && selectedPackage ? t("booking.bookAndPay", { price: formatPrice(total) }) : t("booking.selectPackageAndDate")}
                </button>
                <p style={{fontSize: "11px", color: "#DDD0C0", textAlign: "center", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("booking.securePayment")}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultMode={authModalMode} />
    </main>
  );
}
