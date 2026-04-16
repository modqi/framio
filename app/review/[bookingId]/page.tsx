"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function LeaveReview() {
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
      setBooking(data);
      setLoading(false);
    };
    getData();
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!comment) { setError("Please write a short review."); return; }
    setSaving(true);
    setError("");

    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      client_id: user.id,
      photographer_id: booking.photographer_id,
      rating,
      comment,
      client_name: user.user_metadata?.name || "Anonymous",
    });

    if (error) {
      setError("Something went wrong. Please try again.");
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p style={{fontSize: "13px", color: "#888"}}>Booking not found</p>
    </div>
  );

  if (done) return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
      </nav>
      <div style={{maxWidth: "560px", margin: "0 auto", padding: "80px 32px", textAlign: "center"}}>
        <div style={{fontSize: "56px", marginBottom: "24px"}}>⭐</div>
        <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>THANK YOU</p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px", letterSpacing: "-1px"}}>
          Review submitted!
        </h1>
        <p style={{fontSize: "15px", color: "#888", margin: "0 0 32px", lineHeight: "1.8"}}>
          Thank you for reviewing {booking.photographer_name}. Your review helps other clients find great photographers.
        </p>
        <a href="/dashboard" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "8px", textDecoration: "none", display: "inline-block"}}>
          Back to my bookings
        </a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <a href="/dashboard" style={{fontSize: "12px", color: "#888", textDecoration: "none", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px"}}>
          Back to dashboard
        </a>
      </nav>

      <div style={{maxWidth: "560px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "32px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Leave a review</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
            How was your session?
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>
            Share your experience with {booking.photographer_name}
          </p>
        </div>

        {/* Booking summary */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #f0f0f0", marginBottom: "24px"}}>
          <div className="flex items-center gap-4">
            <div style={{width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#FDF8F5", border: "1px solid #f0e8e0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
              <span style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#C4907A"}}>{booking.photographer_name?.[0]}</span>
            </div>
            <div>
              <p style={{fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px"}}>{booking.photographer_name}</p>
              <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{booking.session_type} — {booking.date}</p>
            </div>
          </div>
        </div>

        {/* Review form */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0"}}>

          {/* Star rating */}
          <div style={{marginBottom: "28px"}}>
            <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "12px", letterSpacing: "0.5px"}}>Your rating</label>
            <div style={{display: "flex", gap: "8px"}}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{fontSize: "36px", border: "none", backgroundColor: "transparent", cursor: "pointer", opacity: star <= (hovered || rating) ? 1 : 0.25, transition: "opacity 0.1s", padding: "0"}}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{fontSize: "13px", color: "#C4907A", margin: "8px 0 0"}}>
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very good"}
                {rating === 5 && "Excellent!"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div style={{marginBottom: "24px"}}>
            <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "8px", letterSpacing: "0.5px"}}>Your review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Tell others about your experience with ${booking.photographer_name}...`}
              rows={5}
              style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", resize: "none", boxSizing: "border-box"}}
            />
            <p style={{fontSize: "11px", color: "#aaa", margin: "6px 0 0", textAlign: "right"}}>{comment.length}/500</p>
          </div>

          {error && (
            <div style={{marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
              <p style={{fontSize: "13px", color: "#cc0000", margin: "0"}}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{width: "100%", backgroundColor: "#C4907A", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600"}}
          >
            {saving ? "Submitting..." : "Submit review"}
          </button>
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