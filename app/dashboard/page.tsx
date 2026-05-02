"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);

      setUnreadCount(count || 0);
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
      case "pending": return { backgroundColor: "#FBF0EA", color: "#B85528" };
      case "declined": return { backgroundColor: "#fef2f2", color: "#dc2626" };
      default: return { backgroundColor: "#F5EFE4", color: "#7A5235" };
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
      <p style={{fontSize: "13px", color: "#B85528", fontFamily: "'Jost', sans-serif"}}>Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <span style={{fontSize: "13px", color: "#7A5235", fontFamily: "'Jost', sans-serif"}}>
            Hello, {user?.user_metadata?.name?.split(" ")[0] || "there"} 👋
          </span>
          <a href="/messages" style={{fontSize: "12px", color: "#7A5235", textDecoration: "none", border: "1px solid #E4D8C4", padding: "6px 16px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Jost', sans-serif"}}>
            💬 Messages
            {unreadCount > 0 && (
              <span style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "999px"}}>
                {unreadCount}
              </span>
            )}
          </a>
          <button onClick={handleSignOut} style={{fontSize: "12px", color: "#7A5235", border: "1px solid #E4D8C4", padding: "6px 16px", borderRadius: "999px", backgroundColor: "transparent", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{maxWidth: "1000px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Welcome */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>MY ACCOUNT</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1C1009", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            Welcome back
          </h1>
          <p style={{fontSize: "14px", color: "#7A5235", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>Find and book talented photographers around the world.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total bookings", value: bookings.length, desc: "All time" },
            { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, desc: "Upcoming sessions" },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, desc: "Awaiting response" },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "24px", border: "1px solid #E4D8C4"}}>
              <p style={{fontSize: "12px", color: "#9E7250", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{stat.label}</p>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1C1009", margin: "0 0 4px", letterSpacing: "-0.02em"}}>{stat.value}</p>
              <p style={{fontSize: "12px", color: "#B85528", margin: "0", fontFamily: "'Jost', sans-serif"}}>{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4", marginBottom: "32px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>QUICK ACTIONS</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/photographers" style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #E4D8C4", borderRadius: "12px", textDecoration: "none", backgroundColor: "#FAF7F1"}}>
              <div style={{width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#B85528", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0}}>📸</div>
              <div>
                <p style={{fontSize: "14px", fontWeight: "500", color: "#1C1009", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>Find a photographer</p>
                <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>Browse all photographers</p>
              </div>
            </a>
            <a href="/messages" style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: unreadCount > 0 ? "1px solid #B85528" : "1px solid #E4D8C4", borderRadius: "12px", textDecoration: "none", backgroundColor: "#FAF7F1"}}>
              <div style={{width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#B85528", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0, position: "relative"}}>
                💬
                {unreadCount > 0 && (
                  <span style={{position: "absolute", top: "-4px", right: "-4px", backgroundColor: "#dc2626", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 5px", borderRadius: "999px"}}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <p style={{fontSize: "14px", fontWeight: "500", color: "#1C1009", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>Messages</p>
                <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "Chat with your photographers"}</p>
              </div>
            </a>
          </div>
        </div>

        {/* Bookings */}
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>MY BOOKINGS</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "26px", fontWeight: "400", color: "#1C1009", margin: "0 0 24px", letterSpacing: "-0.02em"}}>
            Your sessions
          </h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div style={{fontSize: "48px", marginBottom: "16px"}}>📷</div>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", color: "#1C1009", margin: "0 0 8px"}}>No bookings yet</p>
              <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 24px", fontFamily: "'Jost', sans-serif"}}>Your bookings will appear here once you book a photographer</p>
              <a href="/photographers" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                Find a photographer
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} style={{border: "1px solid #E4D8C4", borderRadius: "12px", padding: "20px", backgroundColor: "#FAF7F1"}}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <a href={`/photographers/${booking.photographer_id}`} style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1C1009", margin: "0 0 4px", textDecoration: "none", display: "block"}}>
                        {booking.photographer_name} →
                      </a>
                      <p style={{fontSize: "13px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.session_type}</p>
                    </div>
                    <span style={{...getStatusStyle(booking.status), fontSize: "12px", padding: "4px 12px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>Date</p>
                      <p style={{fontSize: "13px", color: "#1C1009", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.date || "Not set"}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>Location</p>
                      <p style={{fontSize: "13px", color: "#1C1009", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.location || "Not set"}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>Price</p>
                      <p style={{fontSize: "13px", color: "#1C1009", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.price}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>Booked on</p>
                      <p style={{fontSize: "13px", color: "#1C1009", margin: "0", fontFamily: "'Jost', sans-serif"}}>{new Date(booking.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {booking.message && (
                    <div style={{marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E4D8C4"}}>
                      <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>Your message</p>
                      <p style={{fontSize: "13px", color: "#7A5235", margin: "0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>"{booking.message}"</p>
                    </div>
                  )}
                  <div style={{marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E4D8C4", display: "flex", gap: "12px", flexWrap: "wrap"}}>
                    <a href={`/messages/${booking.id}`} style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", border: "1px solid #E4D8C4", padding: "8px 20px", borderRadius: "999px", display: "inline-block", fontFamily: "'Jost', sans-serif"}}>
                      💬 Message photographer
                    </a>
                    {booking.status === "confirmed" && (
                      <a href={`/review/${booking.id}`} style={{fontSize: "13px", color: "#B85528", textDecoration: "none", border: "1px solid #B85528", padding: "8px 20px", borderRadius: "999px", display: "inline-block", fontFamily: "'Jost', sans-serif"}}>
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
      <footer style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}