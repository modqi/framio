"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";

export default function PhotographerProfile() {
  const [photographer, setPhotographer] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState("Portrait (2 hours)");
  const [selectedDate, setSelectedDate] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");
  const [blockedDays, setBlockedDays] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    const getData = async () => {
      const { data: photographerData } = await supabase
        .from("photographers")
        .select("*")
        .eq("id", id)
        .single();
      setPhotographer(photographerData);
      if (photographerData?.user_id) {
        const { data: photoData } = await supabase
          .from("portfolio_photos")
          .select("*")
          .eq("photographer_id", photographerData.user_id)
          .order("order_index", { ascending: true });
        setPhotos(photoData || []);
        const { data: availData } = await supabase
          .from("availability")
          .select("*")
          .eq("photographer_id", photographerData.user_id)
          .eq("is_available", false);
        const blocked = new Set<string>((availData || []).map((row: any) => row.date));
        setBlockedDays(blocked);
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("*")
          .eq("photographer_id", photographerData.user_id)
          .order("created_at", { ascending: false });
        setReviews(reviewData || []);
      }
      // Restore date/sessionType saved before login redirect
      const pending = localStorage.getItem("lomissa_pending_booking");
      if (pending) {
        try {
          const { date, sessionType: st } = JSON.parse(pending);
          if (date) setSelectedDate(date);
          if (st) setSessionType(st);
          localStorage.removeItem("lomissa_pending_booking");
        } catch {}
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
    const days = [];
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

  const handleBooking = async () => {
    if (!selectedDate) { setError("Please select a date first."); return; }
    setBooking(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const id = window.location.pathname.split("/").pop();
      localStorage.setItem("lomissa_pending_booking", JSON.stringify({ date: selectedDate, sessionType }));
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
          sessionType,
          price: photographer?.price || "",
          date: selectedDate,
          location,
          message,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error === "price_on_request"
          ? "This photographer hasn't set a price yet. Please message them to discuss rates before booking."
          : (data.error || "Something went wrong. Please try again."));
        setBooking(false);
        return;
      }
      // Redirect to Stripe checkout — webhook flips booking to pending after payment
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

  // Photographer is "available" only if at least one of the next 30 days is not blocked
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  const isAvailable = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }).some(dateStr => !blockedDays.has(dateStr));

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-6">
          <a href="/photographers" style={{color: "#7A5235", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Explore</a>
          <a href="/signup" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>Sign up</a>
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
            </div>
          </div>
          <div style={{textAlign: "right"}}>
            <p style={{fontSize: "12px", color: "#9E7250", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>Starting from</p>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1C1009", margin: "0", letterSpacing: "-0.02em"}}>{photographer.price || "On request"}</p>
          </div>
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
                <div key={photo.id} style={{aspectRatio: "1", borderRadius: "8px", overflow: "hidden", backgroundColor: "#E4D8C4"}}>
                  <img src={photo.url} alt={`Portfolio photo ${index + 1}`} style={{width: "100%", height: "100%", objectFit: "cover"}}/>
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
            ) : (
              <>
                <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>BOOK A SESSION</p>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1C1009", margin: "0 0 24px"}}>{photographer.name?.split(" ")[0]}</p>

                <div style={{marginBottom: "16px"}}>
                  <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>Session type</label>
                  <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} style={{width: "100%", border: "1px solid #E4D8C4", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", backgroundColor: "#FAF7F1", color: "#1C1009", fontFamily: "'Jost', sans-serif"}}>
                    <option>Portrait (2 hours)</option>
                    <option>Wedding (Full day)</option>
                    <option>Engagement (3 hours)</option>
                    <option>Family (2 hours)</option>
                    <option>Event (4 hours)</option>
                  </select>
                </div>

                <div style={{marginBottom: "16px"}}>
                  <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
                    Select a date {selectedDate && <span style={{color: "#B85528", fontWeight: "600"}}>— {selectedDate}</span>}
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
                        const selected = selectedDate === dateStr;
                        return (
                          <div key={day} onClick={() => handleDayClick(day)} style={{textAlign: "center", padding: "6px 2px", fontSize: "12px", borderRadius: "6px", cursor: past || blocked ? "not-allowed" : "pointer", backgroundColor: selected ? "#B85528" : past || blocked ? "#F5EFE4" : "#FDFBF7", color: selected ? "#FAF7F1" : past || blocked ? "#C3AB88" : "#1C1009", textDecoration: blocked && !past ? "line-through" : "none", fontWeight: selected ? "500" : "400", border: selected ? "1px solid #B85528" : "1px solid #E4D8C4", transition: "all 0.1s", fontFamily: "'Jost', sans-serif"}}>
                            {day}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display: "flex", gap: "12px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #E4D8C4"}}>
                      {[
                        { color: "#FDFBF7", border: "1px solid #E4D8C4", label: "Available" },
                        { color: "#F5EFE4", border: "none", label: "Unavailable" },
                        { color: "#B85528", border: "none", label: "Selected" },
                      ].map((item) => (
                        <div key={item.label} style={{display: "flex", alignItems: "center", gap: "4px"}}>
                          <div style={{width: "8px", height: "8px", borderRadius: "2px", backgroundColor: item.color, border: item.border}}></div>
                          <span style={{fontSize: "10px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: "16px"}}>
                  <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>Location</label>
                  <input type="text" placeholder="Where is the shoot?" value={location} onChange={(e) => setLocation(e.target.value)} style={{width: "100%", border: "1px solid #E4D8C4", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1C1009", backgroundColor: "#FAF7F1", fontFamily: "'Jost', sans-serif"}}/>
                </div>

                <div style={{marginBottom: "24px"}}>
                  <label style={{fontSize: "11px", color: "#7A5235", display: "block", marginBottom: "6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>Message</label>
                  <textarea placeholder="Tell them about your vision..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{width: "100%", border: "1px solid #E4D8C4", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1C1009", backgroundColor: "#FAF7F1", resize: "none", fontFamily: "'Jost', sans-serif"}}/>
                </div>

                {(() => {
                  const priceNum = parseFloat((photographer.price || "").replace(/[^0-9.]/g, ""));
                  const hasPricing = !isNaN(priceNum) && priceNum > 0;
                  return hasPricing ? (
                    <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "16px", marginBottom: "20px"}}>
                      <div style={{display: "flex", justifyContent: "space-between", marginBottom: "8px"}}>
                        <span style={{fontSize: "12px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>Session fee</span>
                        <span style={{fontSize: "12px", color: "#1C1009", fontFamily: "'Jost', sans-serif"}}>{photographer.price}</span>
                      </div>
                      <div style={{display: "flex", justifyContent: "space-between"}}>
                        <span style={{fontSize: "12px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>Lomissa fee</span>
                        <span style={{fontSize: "12px", color: "#1C1009", fontFamily: "'Jost', sans-serif"}}>10%</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", borderRadius: "8px", padding: "16px", marginBottom: "20px"}}>
                      <p style={{fontSize: "13px", color: "#8F3A14", margin: "0 0 4px", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}>Price not set</p>
                      <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>This photographer hasn't listed a price yet. Send them a message to discuss rates before booking.</p>
                    </div>
                  );
                })()}

                {error && (
                  <div style={{marginBottom: "16px", padding: "12px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                    <p style={{fontSize: "12px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
                  </div>
                )}

                {(() => {
                  const priceNum = parseFloat((photographer.price || "").replace(/[^0-9.]/g, ""));
                  const hasPricing = !isNaN(priceNum) && priceNum > 0;
                  return hasPricing ? (
                    <>
                      <button onClick={handleBooking} disabled={booking} style={{width: "100%", backgroundColor: selectedDate ? "#B85528" : "#E4D8C4", color: selectedDate ? "#FAF7F1" : "#C3AB88", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: selectedDate ? "pointer" : "not-allowed", fontWeight: "500", marginBottom: "12px", transition: "all 0.2s", fontFamily: "'Jost', sans-serif", boxShadow: selectedDate ? "0 4px 20px rgba(184,85,40,0.3)" : "none"}}>
                        {booking ? "Redirecting to payment…" : selectedDate ? `Book & Pay — ${selectedDate}` : "Select a date first"}
                      </button>
                      <p style={{fontSize: "11px", color: "#C3AB88", textAlign: "center", margin: "0", fontFamily: "'Jost', sans-serif"}}>You will be taken to a secure payment page</p>
                    </>
                  ) : (
                    <a href={`/messages`} style={{display: "block", width: "100%", backgroundColor: "#1C1009", color: "#FAF7F1", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", marginBottom: "12px", textAlign: "center", textDecoration: "none", fontFamily: "'Jost', sans-serif", boxSizing: "border-box"}}>
                      Message photographer
                    </a>
                  );
                })()}
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