"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";
import { ReviewStarIcon } from "../../components/Icons";
import { useTranslations } from "next-intl";

export default function LeaveReview() {
  const t = useTranslations("Review");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const bookingId = window.location.pathname.split("/").pop();
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (!data || data.client_id !== user.id) {
        window.location.href = "/dashboard";
        return;
      }

      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("client_id", user.id)
        .maybeSingle();

      setBooking(data);
      if (existing) setDone(true);
      setLoading(false);
    };
    getData();
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) { setError(t("errors.noRating")); return; }
    if (!comment) { setError(t("errors.noComment")); return; }
    setSaving(true);
    setError("");

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", booking.id)
      .eq("client_id", user.id)
      .maybeSingle();

    if (existing) {
      setDone(true);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      client_id: user.id,
      photographer_id: booking.photographer_id,
      rating,
      comment,
      client_name: user.user_metadata?.name || "Anonymous",
    });

    if (error) {
      setError(t("errors.genericError"));
    } else {
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("photographer_id", booking.photographer_id);

      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
        await supabase
          .from("photographers")
          .update({ rating: Math.round(avg * 10) / 10, reviews_count: allReviews.length })
          .eq("user_id", booking.photographer_id);
      }
      setDone(true);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>{t("loading")}</p>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("bookingNotFound")}</p>
    </div>
  );

  if (done) return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
      </nav>
      <div style={{maxWidth: "560px", margin: "0 auto", padding: "80px 32px", textAlign: "center"}}>
        <div style={{marginBottom: "24px"}}><ReviewStarIcon size={56} color="#C8622A"/></div>
        <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("done.badge")}</p>
        <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px", letterSpacing: "-0.02em"}}>
          {t("done.heading")}
        </h1>
        <p style={{fontSize: "15px", color: "#7A5C44", margin: "0 0 32px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
          {t("done.description", { name: booking.photographer_name })}
        </p>
        <a href="/dashboard" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", display: "inline-block", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
          {t("done.backToBookings")}
        </a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/dashboard" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", border: "1px solid #E2D5C8", padding: "6px 16px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>
          {t("nav.backToDashboard")}
        </a>
      </nav>

      <div style={{maxWidth: "560px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "32px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {t("heading")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            {t("description", { name: booking.photographer_name })}
          </p>
        </div>

        {/* Booking summary */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "20px", border: "1px solid #E2D5C8", marginBottom: "24px"}}>
          <div className="flex items-center gap-4">
            <div style={{width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#F5EFE4", border: "1px solid #E2D5C8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
              <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#C8622A"}}>{booking.photographer_name?.[0]}</span>
            </div>
            <div>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px"}}>{booking.photographer_name}</p>
              <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.session_type} — {booking.date}</p>
            </div>
          </div>
        </div>

        {/* Review form */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>

          {/* Star rating */}
          <div style={{marginBottom: "28px"}}>
            <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "12px", letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif"}}>{t("ratingLabel")}</label>
            <div style={{display: "flex", gap: "8px"}}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{border: "none", backgroundColor: "transparent", cursor: "pointer", opacity: star <= (hovered || rating) ? 1 : 0.2, transition: "opacity 0.1s", padding: "0", display: "flex"}}
                >
                  <svg viewBox="0 0 64 64" width="36" height="36" fill="none">
                    <circle cx="32" cy="32" r="9" fill="#C8622A"/>
                    <line x1="32" y1="18" x2="32" y2="10" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="32" y1="46" x2="32" y2="54" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="46" y1="32" x2="54" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="18" y1="32" x2="10" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="42" y1="22" x2="48" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="22" y1="22" x2="16" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="42" y1="42" x2="48" y2="48" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="22" y1="42" x2="16" y2="48" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{fontSize: "13px", color: "#C8622A", margin: "8px 0 0", fontFamily: "'Jost', sans-serif"}}>
                {t(`ratings.${rating}` as any)}
              </p>
            )}
          </div>

          {/* Comment */}
          <div style={{marginBottom: "24px"}}>
            <label style={{fontSize: "11px", color: "#7A5C44", display: "block", marginBottom: "8px", letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif"}}>{t("reviewLabel")}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviewPlaceholder", { name: booking.photographer_name })}
              maxLength={500}
              rows={5}
              style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", resize: "none", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
            />
            <p style={{fontSize: "11px", color: "#DDD0C0", margin: "6px 0 0", textAlign: "right", fontFamily: "'Jost', sans-serif"}}>{comment.length}/500</p>
          </div>

          {error && (
            <div style={{marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
              <p style={{fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", boxShadow: "0 4px 20px rgba(184,85,40,0.3)"}}
          >
            {saving ? t("submitting") : t("submit")}
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