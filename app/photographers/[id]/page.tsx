"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function PhotographerProfile() {
  const [photographer, setPhotographer] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
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
      }
      setLoading(false);
    };
    getData();
  }, []);

  const handleBooking = async () => {
    setBooking(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { error } = await supabase.from("bookings").insert({
      client_id: user.id,
      client_name: user.user_metadata?.name || "",
      client_email: user.email,
      photographer_name: photographer?.name,
      photographer_id: photographer?.user_id,
      session_type: sessionType,
      date, location, message,
      price: photographer?.price || "Price on request",
      status: "pending",
    });
    if (error) { setError("Something went wrong. Please try again."); }
    else { setBooked(true); }
    setBooking(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
    </div>
  );

  if (!photographer) return (
    <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
      <p style={{fontFamily: "Georgia, serif", fontSize: "24px", color: "#1a1a1a"}}>Photographer not found</p>
      <a href="/photographers" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "4px", textDecoration: "none"}}>Back to browse</a>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#fff"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/photographers" style={{color: "#888", fontSize: "13px", textDecoration: "none"}}>Explore</a>
          <a href="/signup" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "8px 20px", borderRadius: "24px", textDecoration: "none"}}>Sign up</a>
        </div>
      </nav>

      {/* Profile Header */}
      <section style={{backgroundColor: "#FDF8F5", padding: "48px", borderBottom: "1px solid #f0e8e0"}}>
        <div className="flex items-start justify-between flex-wrap gap-8">
          <div className="flex items-start gap-8">
            <div style={{width: "100px", height: "100px", backgroundColor: "#e8e0d8", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", flexShrink: 0}}>
              <span style={{fontFamily: "Georgia, serif", fontSize: "40px", fontWeight: "700", color: "#C4907A"}}>{photographer.name?.[0] || "?"}</span>
            </div>
            <div>
              <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>{photographer.specialty || "Photographer"}</p>
              <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>{photographer.name}</h1>
              <p style={{fontSize: "13px", color: "#888", margin: "0 0 16px"}}>{photographer.location}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span style={{fontSize: "13px", color: "#888"}}>⭐ {photographer.rating || "New"}</span>
                <span style={{fontSize: "12px", color: "#fff", backgroundColor: "#C4907A", padding: "4px 12px", borderRadius: "20px"}}>Available</span>
                {photographer.instagram && (
                  <a href={`https://instagram.com/${photographer.instagram}`} target="_blank" style={{fontSize: "12px", color: "#C4907A", textDecoration: "none"}}>@{photographer.instagram}</a>
                )}
              </div>
            </div>
          </div>
          <div style={{textAlign: "right"}}>
            <p style={{fontSize: "12px", color: "#888", margin: "0 0 4px"}}>Starting from</p>
            <p style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a", margin: "0", letterSpacing: "-1px"}}>{photographer.price || "On request"}</p>
          </div>
        </div>
      </section>

      {/* Bio */}
      {photographer.bio && (
        <section style={{backgroundColor: "#fff", padding: "32px 48px", borderBottom: "1px solid #f0f0f0"}}>
          <p style={{fontFamily: "Georgia, serif", fontSize: "16px", color: "#555", margin: "0", lineHeight: "1.8", maxWidth: "720px", fontStyle: "italic"}}>
            "{photographer.bio}"
          </p>
        </section>
      )}

      <div className="flex flex-col md:flex-row">

        {/* Left — Portfolio & Reviews */}
        <div style={{flex: 2, padding: "48px", borderRight: "1px solid #f0f0f0"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 20px", letterSpacing: "1px"}}>
            Portfolio {photos.length > 0 && `— ${photos.length} photos`}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-12">
            {photos.length === 0 ? (
              [1,2,3,4,5,6].map((i) => (
                <div key={i} style={{aspectRatio: "1", backgroundColor: "#f5f5f5", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <span style={{fontSize: "12px", color: "#ccc"}}>Photo {i}</span>
                </div>
              ))
            ) : (
              photos.map((photo, index) => (
                <div key={photo.id} style={{aspectRatio: "1", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f5f5f5"}}>
                  <img
                    src={photo.url}
                    alt={`Portfolio photo ${index + 1}`}
                    style={{width: "100%", height: "100%", objectFit: "cover"}}
                  />
                </div>
              ))
            )}
          </div>

          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 20px", letterSpacing: "1px"}}>Reviews</p>
          <div style={{borderTop: "1px solid #f0f0f0", paddingTop: "20px"}}>
            <p style={{fontFamily: "Georgia, serif", fontSize: "16px", color: "#aaa", fontStyle: "italic"}}>No reviews yet</p>
          </div>
        </div>

        {/* Right — Booking Card */}
        <div style={{flex: 1, padding: "48px"}}>
          <div style={{border: "1px solid #e5e5e5", borderRadius: "12px", padding: "32px", position: "sticky", top: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)"}}>
            {booked ? (
              <div className="text-center py-8">
                <div style={{fontSize: "48px", marginBottom: "16px"}}>🎉</div>
                <p style={{fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 12px"}}>Booking requested!</p>
                <p style={{fontSize: "13px", color: "#888", margin: "0 0 24px", lineHeight: "1.7"}}>{photographer.name} will respond within 24 hours.</p>
                <a href="/dashboard" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "4px", textDecoration: "none", display: "inline-block"}}>View my bookings</a>
              </div>
            ) : (
              <>
                <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Book a session</p>
                <p style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 24px"}}>{photographer.name?.split(" ")[0]}</p>

                <div className="mb-4">
                  <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Session type</label>
                  <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", backgroundColor: "#fff", color: "#1a1a1a"}}>
                    <option>Portrait (2 hours)</option>
                    <option>Wedding (Full day)</option>
                    <option>Engagement (3 hours)</option>
                    <option>Family (2 hours)</option>
                    <option>Event (4 hours)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff"}}/>
                </div>

                <div className="mb-4">
                  <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Location</label>
                  <input type="text" placeholder="Where is the shoot?" value={location} onChange={(e) => setLocation(e.target.value)} style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff"}}/>
                </div>

                <div className="mb-6">
                  <label style={{fontSize: "11px", color: "#888", display: "block", marginBottom: "6px"}}>Message</label>
                  <textarea placeholder="Tell them about your vision..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", resize: "none"}}/>
                </div>

                <div style={{backgroundColor: "#FDF8F5", borderRadius: "8px", padding: "16px", marginBottom: "20px"}}>
                  <div className="flex justify-between mb-2">
                    <span style={{fontSize: "12px", color: "#888"}}>Session fee</span>
                    <span style={{fontSize: "12px", color: "#1a1a1a"}}>{photographer.price || "On request"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{fontSize: "12px", color: "#888"}}>Framio fee</span>
                    <span style={{fontSize: "12px", color: "#1a1a1a"}}>10%</span>
                  </div>
                </div>

                {error && (
                  <div style={{marginBottom: "16px", padding: "12px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
                    <p style={{fontSize: "12px", color: "#cc0000", margin: "0"}}>{error}</p>
                  </div>
                )}

                <button onClick={handleBooking} disabled={booking} style={{width: "100%", backgroundColor: "#C4907A", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginBottom: "12px"}}>
                  {booking ? "Sending request..." : "Request to Book"}
                </button>
                <p style={{fontSize: "11px", color: "#aaa", textAlign: "center", margin: "0"}}>You won't be charged yet</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>Framio</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Framio. All rights reserved.</p>
      </footer>

    </main>
  );
}