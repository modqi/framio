"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function PhotographerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [completion, setCompletion] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [tasks, setTasks] = useState([
    { task: "Add profile photo", done: false },
    { task: "Write your bio", done: false },
    { task: "Add portfolio photos", done: false },
    { task: "Set your prices", done: false },
    { task: "Add your location", done: false },
  ]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
      } else if (user.user_metadata?.role !== "photographer") {
        window.location.href = "/dashboard";
      } else {
        setUser(user);
        const meta = user.user_metadata;

        const { count: photoCount } = await supabase
          .from("portfolio_photos")
          .select("*", { count: "exact", head: true })
          .eq("photographer_id", user.id);

        const updatedTasks = [
          { task: "Add profile photo", done: false },
          { task: "Write your bio", done: !!meta?.bio },
          { task: "Add portfolio photos", done: (photoCount || 0) > 0 },
          { task: "Set your prices", done: !!meta?.price },
          { task: "Add your location", done: !!meta?.location },
        ];
        setTasks(updatedTasks);
        const done = updatedTasks.filter(t => t.done).length;
        setCompletion(Math.round((done / updatedTasks.length) * 100));

        const { data } = await supabase
          .from("bookings")
          .select("*")
          .eq("photographer_id", user.id)
          .neq("status", "awaiting_payment")
          .order("created_at", { ascending: false });
        setBookings(data || []);

        const bookingIds = data?.map((b: any) => b.id) ?? [];
        const { count } = bookingIds.length > 0
          ? await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .in("booking_id", bookingIds)
              .eq("receiver_id", user.id)
              .eq("read", false)
          : { count: 0 };
        setUnreadCount(count || 0);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleBookingStatus = async (id: string, status: string) => {
    setProcessingId(id);
    setActionError("");
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      setActionError("Failed to update booking. Please try again.");
      setProcessingId(null);
      return;
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setProcessingId(null);
  };

  const getStatusStyle = (status: string) => {
    if (status === "confirmed") return { backgroundColor: "#f0fdf4", color: "#15803d" };
    if (status === "declined") return { backgroundColor: "#fef2f2", color: "#dc2626" };
    return { backgroundColor: "#FBF0EA", color: "#B85528" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
        <p style={{fontSize: "13px", color: "#B85528", fontFamily: "'Jost', sans-serif"}}>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <span style={{fontSize: "13px", color: "#7A5235", fontFamily: "'Jost', sans-serif"}}>{user?.user_metadata?.name} 📸</span>
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
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>PHOTOGRAPHER DASHBOARD</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1C1009", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            Your photography business
          </h1>
          <p style={{fontSize: "14px", color: "#7A5235", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>Manage your profile, bookings and earnings all in one place.</p>
        </div>

        {/* Profile card */}
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "24px", border: "1px solid #E4D8C4", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px"}}>
          <div style={{width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#F5EFE4", border: "1px solid #E4D8C4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
            <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: "500", color: "#B85528"}}>{user?.user_metadata?.name?.[0] || "?"}</span>
          </div>
          <div style={{flex: 1}}>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1C1009", margin: "0 0 4px"}}>{user?.user_metadata?.name || "Your name"}</p>
            <p style={{fontSize: "12px", color: "#9E7250", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{user?.user_metadata?.location || "No location set"}</p>
            <p style={{fontSize: "12px", color: "#B85528", margin: "0", fontFamily: "'Jost', sans-serif"}}>{user?.user_metadata?.specialty || "No specialty set"}{user?.user_metadata?.price ? ` — ${user?.user_metadata?.price}` : ""}</p>
          </div>
          <a href="/photographer-dashboard/edit-profile" style={{fontSize: "12px", color: "#1C1009", border: "1px solid #E4D8C4", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", backgroundColor: "#FAF7F1", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>
            Edit profile
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total bookings", value: bookings.length, desc: "All time" },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, desc: "Awaiting response" },
            { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, desc: "Confirmed sessions" },
            { label: "Unread messages", value: unreadCount, desc: "New messages" },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "20px", border: "1px solid #E4D8C4"}}>
              <p style={{fontSize: "11px", color: "#9E7250", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{stat.label}</p>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1C1009", margin: "0 0 4px", letterSpacing: "-0.02em"}}>{stat.value}</p>
              <p style={{fontSize: "11px", color: "#B85528", margin: "0", fontFamily: "'Jost', sans-serif"}}>{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Profile completion */}
        <div style={{backgroundColor: "#1C1009", borderRadius: "12px", padding: "32px", marginBottom: "32px"}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{fontSize: "11px", color: "#C1622F", margin: "0 0 6px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>PROFILE STRENGTH</p>
              <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#FAF7F1", margin: "0"}}>Complete your profile</h2>
              <p style={{fontSize: "13px", color: "rgba(250,247,241,0.4)", margin: "4px 0 0", fontFamily: "'Jost', sans-serif"}}>A complete profile gets 3x more bookings</p>
            </div>
            <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "44px", fontWeight: "400", color: "#C1622F", letterSpacing: "-0.02em"}}>{completion}%</span>
          </div>
          <div style={{width: "100%", backgroundColor: "rgba(250,247,241,0.1)", borderRadius: "4px", height: "4px", marginBottom: "24px"}}>
            <div style={{width: `${completion}%`, backgroundColor: "#C1622F", height: "4px", borderRadius: "4px", transition: "width 0.5s"}}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((item) => (
              <div key={item.task} className="flex items-center gap-3">
                <div style={{width: "20px", height: "20px", borderRadius: "50%", backgroundColor: item.done ? "#C1622F" : "transparent", border: item.done ? "none" : "1px solid rgba(250,247,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                  {item.done && <span style={{color: "#FAF7F1", fontSize: "11px"}}>✓</span>}
                </div>
                <span style={{fontSize: "13px", color: item.done ? "rgba(250,247,241,0.4)" : "#FAF7F1", textDecoration: item.done ? "line-through" : "none", fontFamily: "'Jost', sans-serif"}}>{item.task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4", marginBottom: "32px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>QUICK ACTIONS</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: "👤", title: "Edit my profile", desc: "Update your bio, photos and prices", href: "/photographer-dashboard/edit-profile" },
              { icon: "🖼️", title: "My portfolio", desc: "Add and manage your photos", href: "/photographer-dashboard/portfolio" },
              { icon: "📅", title: "My availability", desc: "Set your available days", href: "/photographer-dashboard/availability" },
            ].map((action) => (
              <a key={action.title} href={action.href} style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #E4D8C4", borderRadius: "12px", textDecoration: "none", backgroundColor: "#FAF7F1"}}>
                <div style={{width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#B85528", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0}}>
                  {action.icon}
                </div>
                <div>
                  <p style={{fontSize: "14px", fontWeight: "500", color: "#1C1009", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{action.title}</p>
                  <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{action.desc}</p>
                </div>
              </a>
            ))}
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
                <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "Chat with your clients"}</p>
              </div>
            </a>
          </div>
        </div>

        {/* Booking requests */}
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>INCOMING</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "26px", fontWeight: "400", color: "#1C1009", margin: "0 0 24px", letterSpacing: "-0.02em"}}>Booking requests</h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div style={{fontSize: "48px", marginBottom: "16px"}}>📭</div>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", color: "#1C1009", margin: "0 0 8px"}}>No booking requests yet</p>
              <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 24px", fontFamily: "'Jost', sans-serif"}}>Complete your profile to start receiving bookings</p>
              <a href="/photographer-dashboard/edit-profile" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                Complete my profile
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} style={{border: "1px solid #E4D8C4", borderRadius: "12px", padding: "20px", backgroundColor: "#FAF7F1"}}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1C1009", margin: "0 0 4px"}}>{booking.client_name}</p>
                      <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.client_email}</p>
                    </div>
                    <span style={{...getStatusStyle(booking.status), fontSize: "12px", padding: "4px 12px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "Session", value: booking.session_type },
                      { label: "Date", value: booking.date || "Not set" },
                      { label: "Location", value: booking.location || "Not set" },
                      { label: "Price", value: booking.price },
                    ].map((item) => (
                      <div key={item.label}>
                        <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{item.label}</p>
                        <p style={{fontSize: "13px", color: "#1C1009", margin: "0", fontFamily: "'Jost', sans-serif"}}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {booking.message && (
                    <div style={{backgroundColor: "#FDFBF7", border: "1px solid #E4D8C4", borderRadius: "8px", padding: "12px", marginBottom: "16px"}}>
                      <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>Message from client</p>
                      <p style={{fontSize: "13px", color: "#7A5235", margin: "0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>"{booking.message}"</p>
                    </div>
                  )}
                  {actionError && (
                    <div style={{marginBottom: "12px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                      <p style={{fontSize: "12px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{actionError}</p>
                    </div>
                  )}
                  <div style={{display: "flex", gap: "12px", flexWrap: "wrap"}}>
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleBookingStatus(booking.id, "confirmed")}
                          disabled={processingId === booking.id}
                          style={{flex: 1, backgroundColor: processingId === booking.id ? "#9E7250" : "#1C1009", color: "#FAF7F1", padding: "10px", borderRadius: "999px", border: "none", cursor: processingId === booking.id ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}
                        >
                          {processingId === booking.id ? "Processing..." : "Accept booking"}
                        </button>
                        <button
                          onClick={() => handleBookingStatus(booking.id, "declined")}
                          disabled={processingId === booking.id}
                          style={{flex: 1, backgroundColor: "transparent", color: "#1C1009", padding: "10px", borderRadius: "999px", border: "1px solid #E4D8C4", cursor: processingId === booking.id ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: "'Jost', sans-serif", opacity: processingId === booking.id ? 0.5 : 1}}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    <a href={`/messages/${booking.id}`} style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", border: "1px solid #E4D8C4", padding: "8px 20px", borderRadius: "999px", display: "inline-block", fontFamily: "'Jost', sans-serif"}}>
                      💬 Message client
                    </a>
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