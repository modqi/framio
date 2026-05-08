"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";

export default function PhotographerProfile({ params }: { params: any }) {
  const [photographer, setPhotographer] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

      if (user) {
        const { data: adminRow } = await supabase
          .from("admin_users")
          .select("id")
          .eq("email", user.email)
          .single();
        if (adminRow) setIsAdmin(true);
      }

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
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
      <p style={{fontSize: "13px", color: "#B85528", fontFamily: "'Jost', sans-serif"}}>Loading...</p>
    </div>
  );

  if (!photographer) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{backgroundColor: "#FAF7F1"}}>
      <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", color: "#1C1009"}}>Photographer not found</p>
      <a href="/photographers" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Back to browse</a>
    </div>
  );

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
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
    flexible: { label: "Flexible cancellation", desc: "Full refund up to 24h before", color: "#15803d", bg: "#f0fdf4" },
    moderate: { label: "Moderate cancellation", desc: "Full refund up to 48h before", color: "#B85528", bg: "#FBF0EA" },
    strict:   { label: "Strict cancellation",   desc: "No refund once confirmed",     color: "#dc2626", bg: "#fef2f2" },
  };
  const policyInfo = policyMap[policy] || policyMap.moderate;

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-6">
          {isAdmin ? (
            <a href="/admin" style={{color: "#7A5235", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>← Admin panel</a>
          ) : (
            <a href="/photographers" style={{color: "#7A5235", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Explore</a>
          )}
          {authUser ? (
            <>
              <span style={{fontSize: "13px", color: "#7A5235", fontFamily: "'Jost', sans-serif"}}>
                {authUser.user_metadata?.name?.split(" ")[0] || "Hi"}
              </span>
              <a
                href={isAdmin ? "/admin" : authUser.user_metadata?.role === "photographer" ? "/photographer-dashboard" : "/dashboard"}
                style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}
              >
                {isAdmin ? "Admin panel" : "My dashboard"}
              </a>
            </>
          ) : (
            <>
              <a href="/login" style={{color: "#7A5235", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Log in</a>
              <a href="/signup" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>Sign up</a>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{backgroundColor: "#F5EFE4", padding: "48px", borderBottom: "1px solid #E4D8C4"}}>
        <div className="flex items-start justify-between flex-wrap gap-8">
          <div className="flex items-start gap-8">
            <div style={{width: "100px", height: "100px", backgroundColor: "#E4D8C4", backgroundImage: "repeating-linear-gradient(-45deg,#E4D8C4,#E4D8C4 6px,#EDE3D1 6px,#EDE3D1 14px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", flexShrink: 0}}>
              <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "44px", fontWeight: "400", color: "#B85528"}}>{photographer.name?.[0] || "?"}</span>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{photographer.specialty || "PHOTOGRAPHER"}</p>
              <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1C1009", margin: "0 0 8px", letterSpacing: "-0.02em"}}>{photographer.name}</h1>
              <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>{photographer.location}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span style={{fontSize: "13px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>⭐ {photographer.rating || "New"}</span>
                {reviews.length > 0 && <span style={{fontSize: "12px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>({reviews.length} reviews)</span>}
                {isAvailable && <span style={{fontSize: "12px", color: "#FAF7F1", backgroundColor: "#B85528", padding: "4px 12px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>Available</span>}
                {photographer.instagram && (
                  <a href={`https://instagram.com/${photographer.instagram}`} target="_blank" style={{fontSize: "12px", color: "#B85528", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>@{photographer.instagram}</a>
                )}
              </div>
              {(() => {
                const cats: string[] = photographer.specialities?.length > 0
                  ? photographer.specialities
                  : photographer.specialty ? [photographer.specialty] : [];
                return cats.length > 0 ? (
                  <div style={{display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px"}}>
                    {cats.map((cat: string) => (
                      <span key={cat} style={{fontSize: "11px", color: "#B85528", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", padding: "3px 12px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
          {minPackagePrice !== null && (
            <div style={{textAlign: "right"}}>
              <p style={{fontSize: "12px", color: "#9E7250", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>From</p>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1C1009", margin: "0", letterSpacing: "-0.02em"}}>{minPackagePrice.toLocaleString()} NOK</p>
            </div>
          )}
        </div>
      </section>

      {/* Bio */}
      {photographer.bio && (
        <section style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderBottom: "1px solid #E4D8C4"}}>
          <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#7A5235", margin: "0", lineHeight: "1.8", maxWidth: "720px", fontStyle: "italic"}}>
            "{photographer.bio}"
          </p>
        </section>
      )}

      {/* Photographer terms (delivery, copyright, etc.) */}
      {(photographer.delivery_time || photographer.copyright_ownership || photographer.editing_style || photographer.revisions_included) && (() => {
        const terms = [
          { icon: "⏱️", label: "Delivery time",  value: photographer.delivery_time },
          { icon: "⚖️", label: "Copyright",      value: photographer.copyright_ownership },
          { icon: "🎨", label: "Editing style",  value: photographer.editing_style },
          { icon: "✏️", label: "Revisions",      value: photographer.revisions_included },
        ].filter(t => t.value);
        return (
          <section style={{backgroundColor: "#FDFBF7", padding: "32px 48px", borderBottom: "1px solid #E4D8C4"}}>
            <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>WHAT'S INCLUDED</p>
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px"}}>
              {terms.map((t) => (
                <div key={t.label} style={{display: "flex", alignItems: "flex-start", gap: "12px"}}>
                  <div style={{width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F5EFE4", border: "1px solid #E4D8C4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0}}>{t.icon}</div>
                  <div>
                    <p style={{fontSize: "10px", color: "#B85528", margin: "0 0 3px", letterSpacing: "0.1em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t.label.toUpperCase()}</p>
                    <p style={{fontSize: "13px", color: "#1C1009", margin: "0", fontFamily: "'Jost', sans-serif", lineHeight: "1.5"}}>{t.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      <div className="flex flex-col md:flex-row">

        {/* Left — portfolio & reviews */}
        <div style={{flex: 2, padding: "48px", borderRight: "1px solid #E4D8C4"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            PORTFOLIO {photos.length > 0 && `— ${photos.length} PHOTOS`}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-12">
            {photos.length === 0 ? (
              [1,2,3,4,5,6].map((i) => (
                <div key={i} style={{aspectRatio: "1", backgroundColor: "#E4D8C4", backgroundImage: "repeating-linear-gradient(-45deg,#E4D8C4,#E4D8C4 6px,#EDE3D1 6px,#EDE3D1 14px)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <span style={{fontSize: "12px", color: "#C3AB88", fontFamily: "'Jost', sans-serif"}}>Photo {i}</span>
                </div>
              ))
            ) : (
              photos.map((photo, index) => (
                <div key={photo.id} style={{aspectRatio: "1", borderRadius: "8px", overflow: "hidden", backgroundColor: "#E4D8C4", position: "relative"}}>
                  <Image src={photo.url} alt={`Portfolio photo ${index + 1}`} fill sizes="(max-width: 768px) 33vw, 20vw" style={{objectFit: "cover"}}/>
                </div>
              ))
            )}
          </div>

          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            REVIEWS {reviews.length > 0 && `— ${reviews.length}`}
          </p>
          <div style={{borderTop: "1px solid #E4D8C4", paddingTop: "20px"}}>
            {reviews.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#C3AB88", fontStyle: "italic"}}>No reviews yet</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {reviews.map((review: any) => (
                  <div key={review.id} style={{padding: "16px", border: "1px solid #E4D8C4", borderRadius: "12px", backgroundColor: "#FDFBF7"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px"}}>
                      <div>
                        <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "16px", fontWeight: "500", color: "#1C1009", margin: "0 0 2px"}}>{review.client_name}</p>
                        <p style={{fontSize: "11px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{display: "flex", gap: "2px"}}>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} style={{fontSize: "14px", opacity: star <= review.rating ? 1 : 0.2}}>⭐</span>
                        ))}
                      </div>
                    </div>
                    <p style={{fontSize: "14px", color: "#7A5235", margin: "0", lineHeight: "1.7", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>"{review.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — booking form */}
        <div style={{flex: 1, padding: "48px"}}>
          <div style={{border: "1px solid #E4D8C4", borderRadius: "16px", padding: "32px", position: "sticky", top: "32px", boxShadow: "0 4px 24px rgba(28,16,9,0.08)", backgroundColor: "#FDFBF7"}}>
            {booked ? (
              <div className="text-center py-8">
                <div style={{fontSize: "48px", marginBottom: "16px"}}>🎉</div>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "26px", fontWeight: "400", color: "#1C1009", margin: "0 0 12px"}}>Booking requested!</p>
                <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 8px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif"}}>{photographer.name} will respond within 24 hours.</p>
                <p style={{fontSize: "13px", color: "#B85528", margin: "0 0 24px", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}>{selectedDate}</p>
                <a href="/dashboard" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>View my bookings</a>
              </div>
            ) : packages.length === 0 ? (
              <div>
                <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>BOOK A SESSION</p>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", color: "#C3AB88", fontStyle: "italic", margin: "0 0 16px"}}>No packages yet</p>
                <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 24px", fontFamily: "'Jost', sans-serif", lineHeight: "1.6"}}>This photographer hasn't listed any packages yet. Send them a message to discuss rates and availability.</p>
                <a href="/messages" style={{display: "block", textAlign: "center", backgroundColor: "#1C1009", color: "#FAF7F1", fontSize: "13px", padding: "14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>Message photographer</a>
              </div>
            ) : (
              <>
                <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>BOOK A SESSION</p>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1C1009", margin: "0 0 20px"}}>{photographer.name?.split(" ")[0]}</p>

                {/* Package selector */}
                <div style={{marginBottom: "20px"}}>
                  <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>CHOOSE A PACKAGE</label>
                  <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                    {packages.map((pkg) => {
                      const selected = selectedPackage?.id === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg)}
                          style={{border: `1px solid ${selected ? "#B85528" : "#E4D8C4"}`, borderRadius: "10px", padding: "14px 16px", textAlign: "left", cursor: "pointer", backgroundColor: selected ? "#FBF0EA" : "#FAF7F1", width: "100%", transition: "all 0.1s"}}
                        >
                          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px"}}>
                            <div style={{flex: 1}}>
                              <div style={{display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px"}}>
                                <p style={{fontSize: "13px", fontWeight: "500", color: "#1C1009", margin: "0", fontFamily: "'Jost', sans-serif"}}>{pkg.name}</p>
                                {pkg.category && <span style={{fontSize: "10px", color: "#B85528", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", padding: "1px 7px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>{pkg.category}</span>}
                              </div>
                              <p style={{fontSize: "11px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{pkg.duration} · {pkg.photos_delivered} photos</p>
                              {pkg.description && <p style={{fontSize: "11px", color: "#7A5235", margin: "4px 0 0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>{pkg.description}</p>}
                            </div>
                            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: selected ? "#B85528" : "#1C1009", margin: "0", flexShrink: 0}}>{pkg.price.toLocaleString()} NOK</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add-ons */}
                {addons.length > 0 && (
                  <div style={{marginBottom: "20px"}}>
                    <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>ADD-ONS (OPTIONAL)</label>
                    <div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
                      {addons.map((addon) => {
                        const qty = addonQty[addon.id] || 0;
                        return (
                          <div key={addon.id} style={{border: `1px solid ${qty > 0 ? "#B85528" : "#E4D8C4"}`, borderRadius: "8px", padding: "10px 12px", backgroundColor: qty > 0 ? "#FBF0EA" : "#FAF7F1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", transition: "all 0.1s"}}>
                            <div style={{flex: 1}}>
                              <p style={{fontSize: "13px", color: "#1C1009", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{addon.name}</p>
                              <p style={{fontSize: "11px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{addon.price.toLocaleString()} NOK {addon.unit}</p>
                            </div>
                            {qty === 0 ? (
                              <button onClick={() => setAddonQuantity(addon.id, 1)} style={{fontSize: "12px", color: "#B85528", background: "none", border: "1px solid #E8A97E", borderRadius: "999px", padding: "4px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif", flexShrink: 0}}>Add</button>
                            ) : (
                              <div style={{display: "flex", alignItems: "center", gap: "8px", flexShrink: 0}}>
                                <button onClick={() => setAddonQuantity(addon.id, qty - 1)} style={{width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #E4D8C4", backgroundColor: "#FAF7F1", cursor: "pointer", fontSize: "14px", color: "#1C1009", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", flexShrink: 0}}>−</button>
                                <span style={{fontSize: "13px", fontWeight: "500", color: "#1C1009", fontFamily: "'Jost', sans-serif", minWidth: "16px", textAlign: "center"}}>{qty}</span>
                                <button onClick={() => setAddonQuantity(addon.id, qty + 1)} style={{width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #B85528", backgroundColor: "#B85528", cursor: "pointer", fontSize: "14px", color: "#FAF7F1", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", flexShrink: 0}}>+</button>
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
                  <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
                    SELECT A DATE {selectedDate && <span style={{color: "#B85528", fontWeight: "600"}}>— {selectedDate}</span>}
                  </label>
                  <div style={{border: "1px solid #E4D8C4", borderRadius: "8px", padding: "12px", backgroundColor: "#FAF7F1"}}>
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={prevMonth} disabled={isCurrentMonth} style={{border: "none", backgroundColor: "transparent", cursor: isCurrentMonth ? "not-allowed" : "pointer", fontSize: "16px", color: isCurrentMonth ? "#C3AB88" : "#9E7250", padding: "4px 8px", opacity: isCurrentMonth ? 0.4 : 1}}>←</button>
                      <span style={{fontSize: "12px", fontWeight: "500", color: "#1C1009", fontFamily: "'Jost', sans-serif"}}>{monthName}</span>
                      <button onClick={nextMonth} style={{border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "16px", color: "#9E7250", padding: "4px 8px"}}>→</button>
                    </div>
                    <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px"}}>
                      {["M","T","W","T","F","S","S"].map((d, i) => (
                        <div key={i} style={{textAlign: "center", fontSize: "10px", color: "#C3AB88", padding: "2px", fontFamily: "'Jost', sans-serif"}}>{d}</div>
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
                          <div key={day} onClick={() => handleDayClick(day)} style={{textAlign: "center", padding: "6px 2px", fontSize: "12px", borderRadius: "6px", cursor: past || blocked ? "not-allowed" : "pointer", backgroundColor: sel ? "#B85528" : past || blocked ? "#F5EFE4" : "#FDFBF7", color: sel ? "#FAF7F1" : past || blocked ? "#C3AB88" : "#1C1009", textDecoration: blocked && !past ? "line-through" : "none", fontWeight: sel ? "500" : "400", border: sel ? "1px solid #B85528" : "1px solid #E4D8C4", transition: "all 0.1s", fontFamily: "'Jost', sans-serif"}}>
                            {day}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display: "flex", gap: "12px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #E4D8C4"}}>
                      {[{color: "#FDFBF7", border: "1px solid #E4D8C4", label: "Available"}, {color: "#F5EFE4", border: "none", label: "Unavailable"}, {color: "#B85528", border: "none", label: "Selected"}].map(item => (
                        <div key={item.label} style={{display: "flex", alignItems: "center", gap: "4px"}}>
                          <div style={{width: "8px", height: "8px", borderRadius: "2px", backgroundColor: item.color, border: item.border}}></div>
                          <span style={{fontSize: "10px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div style={{marginBottom: "16px"}}>
                  <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>LOCATION</label>
                  <input type="text" placeholder="Where is the shoot?" value={location} onChange={(e) => setLocation(e.target.value)} style={{width: "100%", border: "1px solid #E4D8C4", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1C1009", backgroundColor: "#FAF7F1", fontFamily: "'Jost', sans-serif"}}/>
                </div>

                {/* Message */}
                <div style={{marginBottom: "20px"}}>
                  <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>MESSAGE</label>
                  <textarea placeholder="Tell them about your vision..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{width: "100%", border: "1px solid #E4D8C4", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1C1009", backgroundColor: "#FAF7F1", resize: "none", fontFamily: "'Jost', sans-serif"}}/>
                </div>

                {/* Order summary */}
                {selectedPackage && (
                  <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "16px", marginBottom: "16px"}}>
                    <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 10px", letterSpacing: "0.1em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ORDER SUMMARY</p>
                    <div style={{display: "flex", justifyContent: "space-between", marginBottom: "6px"}}>
                      <span style={{fontSize: "12px", color: "#7A5235", fontFamily: "'Jost', sans-serif"}}>{selectedPackage.name}</span>
                      <span style={{fontSize: "12px", color: "#1C1009", fontFamily: "'Jost', sans-serif"}}>{selectedPackage.price.toLocaleString()} NOK</span>
                    </div>
                    {selectedAddonsList.map(addon => (
                      <div key={addon.id} style={{display: "flex", justifyContent: "space-between", marginBottom: "6px"}}>
                        <span style={{fontSize: "12px", color: "#7A5235", fontFamily: "'Jost', sans-serif"}}>{addon.name} ×{addonQty[addon.id]}</span>
                        <span style={{fontSize: "12px", color: "#1C1009", fontFamily: "'Jost', sans-serif"}}>+{(addon.price * addonQty[addon.id]).toLocaleString()} NOK</span>
                      </div>
                    ))}
                    <div style={{borderTop: "1px solid #E4D8C4", marginTop: "8px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                      <span style={{fontSize: "13px", fontWeight: "500", color: "#1C1009", fontFamily: "'Jost', sans-serif"}}>Total</span>
                      <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1C1009"}}>{total.toLocaleString()} NOK</span>
                    </div>
                  </div>
                )}

                {/* Cancellation policy */}
                <div style={{backgroundColor: policyInfo.bg, borderRadius: "8px", padding: "12px 14px", marginBottom: "16px"}}>
                  <p style={{fontSize: "11px", fontWeight: "600", color: policyInfo.color, margin: "0 0 2px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{policyInfo.label.toUpperCase()}</p>
                  <p style={{fontSize: "12px", color: "#7A5235", margin: "0", fontFamily: "'Jost', sans-serif"}}>{policyInfo.desc}</p>
                </div>

                {error && (
                  <div style={{marginBottom: "16px", padding: "12px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                    <p style={{fontSize: "12px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={booking || !selectedDate || !selectedPackage}
                  style={{width: "100%", backgroundColor: selectedDate && selectedPackage ? "#B85528" : "#E4D8C4", color: selectedDate && selectedPackage ? "#FAF7F1" : "#C3AB88", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: selectedDate && selectedPackage ? "pointer" : "not-allowed", fontWeight: "500", marginBottom: "12px", transition: "all 0.2s", fontFamily: "'Jost', sans-serif", boxShadow: selectedDate && selectedPackage ? "0 4px 20px rgba(184,85,40,0.3)" : "none"}}
                >
                  {booking ? "Redirecting to payment…" : selectedDate && selectedPackage ? `Book & Pay — ${total.toLocaleString()} NOK` : "Select a package and date"}
                </button>
                <p style={{fontSize: "11px", color: "#C3AB88", textAlign: "center", margin: "0", fontFamily: "'Jost', sans-serif"}}>You will be taken to a secure payment page</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}
