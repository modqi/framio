"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      setBookings(bookings || []);
      setLoading(false);
    };
    init();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed": return { backgroundColor: "#f0fdf4", color: "#15803d" };
      case "pending": return { backgroundColor: "#FDF8F5", color: "#C4907A" };
      case "declined": return { backgroundColor: "#fef2f2", color: "#dc2626" };
      default: return { backgroundColor: "#f5f5f5", color: "#888" };
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAFAF8"}}>
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-4">
          <span style={{fontSize: "13px", color: "#888"}}>
            Hello, {user?.user_metadata?.name?.split(" ")[0] || "there"} 👋
          </span>
          <a href="/messages" style={{fontSize: "12px", color: "#888", textDecoration: "none", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px"}}>
            💬 Messages
          </a>
          <button onClick={handleSignOut} style={{fontSize: "12px", color: "#888", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px", backgroundColor: "#fff", cursor: "pointer"}}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{maxWidth: "1000px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Welcome */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>My account</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
            Welcome back
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>Find and book talented photographers around the world.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total bookings", value: bookings.length, desc: "All time" },
            { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, desc: "Upcoming sessions" },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, desc: "Awaiting response" },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #f0f0f0"}}>
              <p style={{fontSize: "12px", color: "#888", margin: "0 0 8px"}}>{stat.label}</p>
              <p style={{fontFamily: "Georgia, serif", fontSize: "40px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-1px"}}>{stat.value}</p>
              <p style={{fontSize: "12px", color: "#C4907A", margin: "0"}}>{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0", marginBottom: "32px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 16px", letterSpacing: "1px"}}>Quick actions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/photographers" style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #f0f0f0", borderRadius: "8px", textDecoration: "none", backgroundColor: "#FAFAF8"}}>
              <div style={{width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#C4907A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0}}>📸</div>
              <div>
                <p style={{fontSize: "14px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 2px"}}>Find a photographer</p>
                <p style={{fontSize: "12px", color: "#888", margin: "0"}}>Browse all photographers</p>
              </div>
            </a>
            <a href="/messages" style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #f0f0f0", borderRadius: "8px", textDecoration: "none", backgroundColor: "#FAFAF8"}}>
              <div style={{width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#C4907A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0}}>💬</div>
              <div>
                <p style={{fontSize: "14px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 2px"}}>Messages</p>
                <p style={{fontSize: "12px", color: "#888", margin: "0"}}>Chat with your photographers</p>
              </div>
            </a>
          </div>
        </div>

        {/* Bookings */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>My bookings</p>
          <h2 style={{fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 24px", letterSpacing: "-0.5px"}}>
            Your sessions
          </h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div style={{fontSize: "48px", marginBottom: "16px"}}>📷</div>
              <p style={{fontFamily: "Georgia, serif", fontSize: "18px", color: "#1a1a1a", margin: "0 0 8px"}}>No bookings yet</p>
              <p style={{fontSize: "13px", color: "#888", margin: "0 0 24px"}}>Your bookings will appear here once you book a photographer</p>
              <a href="/photographers" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "24px", textDecoration: "none"}}>
                Find a photographer
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} style={{border: "1px solid #f0f0f0", borderRadius: "12px", padding: "20px", backgroundColor: "#FAFAF8"}}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <a href={`/photographers/${booking.photographer_id}`} style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px", textDecoration: "none"}}>
                        {booking.photographer_name} →
                      </a>
                      <p style={{fontSize: "13px", color: "#888", margin: "0"}}>{booking.session_type}</p>
                    </div>
                    <span style={{...getStatusStyle(booking.status), fontSize: "12px", padding: "4px 12px", borderRadius: "20px", fontWeight: "500"}}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 4px"}}>Date</p>
                      <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{booking.date || "Not set"}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 4px"}}>Location</p>
                      <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{booking.location || "Not set"}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 4px"}}>Price</p>
                      <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{booking.price}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 4px"}}>Booked on</p>
                      <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{new Date(booking.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {booking.message && (
                    <div style={{marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f0f0f0"}}>
                      <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 4px"}}>Your message</p>
                      <p style={{fontSize: "13px", color: "#888", margin: "0", fontStyle: "italic", fontFamily: "Georgia, serif"}}>"{booking.message}"</p>
                    </div>
                  )}
                  <div style={{marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "12px", flexWrap: "wrap"}}>
                    <a href={`/messages/${booking.id}`} style={{fontSize: "13px", color: "#888", textDecoration: "none", border: "1px solid #e5e5e5", padding: "8px 20px", borderRadius: "20px", display: "inline-block"}}>
                      💬 Message photographer
                    </a>
                    {booking.status === "confirmed" && (
                      <a href={`/review/${booking.id}`} style={{fontSize: "13px", color: "#C4907A", textDecoration: "none", border: "1px solid #C4907A", padding: "8px 20px", borderRadius: "20px", display: "inline-block"}}>
                        Leave a review ⭐
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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