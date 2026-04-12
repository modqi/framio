"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function PhotographerProfile() {
  const [photographer, setPhotographer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState("Portrait (2 hours)");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    const getPhotographer = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .eq("id", id)
        .single();
      setPhotographer(data);
      setLoading(false);
    };
    getPhotographer();
  }, []);

  const handleBooking = async () => {
    setBooking(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const { error } = await supabase.from("bookings").insert({
      client_id: user.id,
      client_name: user.user_metadata?.name || "",
      client_email: user.email,
      photographer_name: photographer?.name,
      photographer_id: photographer?.user_id,
      session_type: sessionType,
      date: date,
      location: location,
      message: message,
      price: photographer?.price || "Price on request",
      status: "pending",
    });
    if (error) {
      setError("Something went wrong. Please try again.");
    } else {
      setBooked(true);
    }
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p style={{fontSize: "11px", letterSpacing: "4px", color: "#888"}}>LOADING...</p>
      </div>
    );
  }

  if (!photographer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p style={{fontFamily: "Georgia, serif", fontSize: "24px", color: "#2C2C2A", margin: "0 0 12px"}}>Photographer not found</p>
          <a href="/photographers" style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "11px", padding: "12px 32px", textDecoration: "none", letterSpacing: "2px"}}>
            BACK TO BROWSE
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: "#fff"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "2px solid #2C2C2A", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#2C2C2A", letterSpacing: "-1px", textDecoration: "none"}}>
            Framio
          </a>
          <span style={{fontSize: "8px", letterSpacing: "4px", color: "#888", paddingLeft: "8px", borderLeft: "1px solid #ddd"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/photographers" style={{color: "#888", fontSize: "12px"}}>Explore</a>
          <a href="/signup" style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "12px", padding: "7px 20px", textDecoration: "none"}}>
            Sign up
          </a>
        </div>
      </nav>

      {/* Profile Header — dark block */}
      <section style={{backgroundColor: "#2C2C2A", padding: "48px"}}>
        <div className="flex items-start justify-between flex-wrap gap-8">
          <div className="flex items-start gap-8">
            <div style={{width: "100px", height: "100px", backgroundColor: "#444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
              <span style={{fontFamily: "Georgia, serif", fontSize: "40px", fontWeight: "700", color: "#666"}}>{photographer.name?.[0] || "?"}</span>
            </div>
            <div>
              <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 8px"}}>{photographer.specialty?.toUpperCase() || "PHOTOGRAPHER"}</p>
              <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "700", color: "#fff", margin: "0 0 8px", letterSpacing: "-1px"}}>
                {photographer.name}
              </h1>
              <p style={{fontSize: "13px", color: "#888", margin: "0 0 16px", letterSpacing: "1px"}}>{photographer.location}</p>
              <div className="flex items-center gap-4">
                <span style={{fontSize: "12px", color: "#888"}}>⭐ {photographer.rating || "New"}</span>
                <span style={{fontSize: "9px", letterSpacing: "2px", color: "#fff", border: "1px solid #444", padding: "4px 10px"}}>AVAILABLE</span>
                {photographer.instagram && (
                  <a href={`https://instagram.com/${photographer.instagram}`} target="_blank" style={{fontSize: "11px", color: "#888", textDecoration: "none", letterSpacing: "1px"}}>
                    @{photographer.instagram}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div style={{textAlign: "right"}}>
            <p style={{fontSize: "9px", letterSpacing: "3px", color: "#888", margin: "0 0 4px"}}>STARTING FROM</p>
            <p style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#fff", margin: "0", letterSpacing: "-1px"}}>
              {photographer.price || "On request"}
            </p>
          </div>
        </div>
      </section>

      {/* Bio strip */}
      {photographer.bio && (
        <section style={{backgroundColor: "#f5f5f5", padding: "32px 48px", borderBottom: "1px solid #e5e5e5"}}>
          <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 12px"}}>ABOUT</p>
          <p style={{fontFamily: "Georgia, serif", fontSize: "16px", color: "#2C2C2A", margin: "0", lineHeight: "1.8", maxWidth: "720px", fontStyle: "italic"}}>
            "{photographer.bio}"
          </p>
        </section>
      )}

      <div className="flex flex-col md:flex-row">

        {/* Left — Portfolio & Reviews */}
        <div style={{flex: 2, padding: "48px", borderRight: "1px solid #f0f0f0"}}>

          <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 20px"}}>PORTFOLIO</p>
          <div className="grid grid-cols-3 gap-3 mb-12">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} style={{aspectRatio: "1", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center"}}>
                <span style={{fontSize: "11px", letterSpacing: "2px", color: "#ccc"}}>PHOTO {i}</span>
              </div>
            ))}
          </div>

          <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 20px"}}>REVIEWS</p>
          <div style={{borderTop: "1px solid #f0f0f0", paddingTop: "20px"}}>
            <p style={{fontFamily: "Georgia, serif", fontSize: "16px", color: "#aaa", fontStyle: "italic"}}>No reviews yet</p>
          </div>
        </div>

        {/* Right — Booking Card */}
        <div style={{flex: 1, padding: "48px"}}>
          <div style={{border: "1px solid #2C2C2A", padding: "32px", position: "sticky", top: "32px"}}>

            {booked ? (
              <div className="text-center py-8">
                <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 16px"}}>CONFIRMED</p>
                <p style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 12px"}}>Booking requested!</p>
                <p style={{fontSize: "13px", color: "#888", margin: "0 0 24px", lineHeight: "1.7"}}>
                  {photographer.name} will respond within 24 hours.
                </p>
                <a href="/dashboard" style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "11px", padding: "12px 32px", textDecoration: "none", letterSpacing: "2px", display: "inline-block"}}>
                  VIEW MY BOOKINGS
                </a>
              </div>
            ) : (
              <>
                <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 8px"}}>BOOK</p>
                <p style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 24px"}}>
                  {photographer.name?.split(" ")[0]}
                </p>

                <div className="mb-4">
                  <label style={{fontSize: "9px", letterSpacing: "3px", color: "#888", display: "block", marginBottom: "8px"}}>SESSION TYPE</label>
                  <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} style={{width: "100%", border: "1px solid #2C2C2A", padding: "10px 12px", fontSize: "13px", outline: "none", backgroundColor: "#fff", color: "#2C2C2A"}}>
                    <option>Portrait (2 hours)</option>
                    <option>Wedding (Full day)</option>
                    <option>Engagement (3 hours)</option>
                    <option>Family (2 hours)</option>
                    <option>Event (4 hours)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label style={{fontSize: "9px", letterSpacing: "3px", color: "#888", display: "block", marginBottom: "8px"}}>DATE</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{width: "100%", border: "1px solid #2C2C2A", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#2C2C2A", backgroundColor: "#fff"}}/>
                </div>

                <div className="mb-4">
                  <label style={{fontSize: "9px", letterSpacing: "3px", color: "#888", display: "block", marginBottom: "8px"}}>LOCATION</label>
                  <input type="text" placeholder="Where is the shoot?" value={location} onChange={(e) => setLocation(e.target.value)} style={{width: "100%", border: "1px solid #2C2C2A", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#2C2C2A", backgroundColor: "#fff"}}/>
                </div>

                <div className="mb-6">
                  <label style={{fontSize: "9px", letterSpacing: "3px", color: "#888", display: "block", marginBottom: "8px"}}>MESSAGE</label>
                  <textarea placeholder="Tell them about your vision..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{width: "100%", border: "1px solid #2C2C2A", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#2C2C2A", backgroundColor: "#fff", resize: "none"}}/>
                </div>

                <div style={{borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginBottom: "20px"}}>
                  <div className="flex justify-between mb-2">
                    <span style={{fontSize: "12px", color: "#888"}}>Session fee</span>
                    <span style={{fontSize: "12px", color: "#2C2C2A"}}>{photographer.price || "On request"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{fontSize: "12px", color: "#888"}}>Framio fee</span>
                    <span style={{fontSize: "12px", color: "#2C2C2A"}}>10%</span>
                  </div>
                </div>

                {error && (
                  <div style={{marginBottom: "16px", padding: "12px", border: "1px solid #e5e5e5", backgroundColor: "#fff8f8"}}>
                    <p style={{fontSize: "12px", color: "#cc0000", margin: "0"}}>{error}</p>
                  </div>
                )}

                <button onClick={handleBooking} disabled={booking} style={{width: "100%", backgroundColor: "#2C2C2A", color: "#fff", fontSize: "11px", padding: "14px", border: "none", cursor: "pointer", letterSpacing: "2px"}}>
                  {booking ? "SENDING..." : "REQUEST TO BOOK"}
                </button>
                <p style={{fontSize: "11px", color: "#aaa", textAlign: "center", margin: "12px 0 0", letterSpacing: "1px"}}>YOU WON'T BE CHARGED YET</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "2px solid #2C2C2A", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 4px", letterSpacing: "-0.5px"}}>Framio</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#888", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <p style={{fontSize: "11px", color: "#888", margin: "0", letterSpacing: "1px"}}>© 2026 FRAMIO. ALL RIGHTS RESERVED.</p>
      </footer>

    </main>
  );
}