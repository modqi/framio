"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function PhotographerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [completion, setCompletion] = useState(0);
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
      } else {
        setUser(user);
        const meta = user.user_metadata;
        const updatedTasks = [
          { task: "Add profile photo", done: false },
          { task: "Write your bio", done: !!meta?.bio },
          { task: "Add portfolio photos", done: false },
          { task: "Set your prices", done: !!meta?.price },
          { task: "Add your location", done: !!meta?.location },
        ];
        setTasks(updatedTasks);
        const done = updatedTasks.filter(t => t.done).length;
        setCompletion(Math.round((done / updatedTasks.length) * 100));
        const { data } = await supabase
          .from("bookings")
          .select("*")
          .eq("photographer_name", meta?.name)
          .order("created_at", { ascending: false });
        setBookings(data || []);
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
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const getStatusStyle = (status: string) => {
    if (status === "confirmed") return { backgroundColor: "#f0fdf4", color: "#15803d" };
    if (status === "declined") return { backgroundColor: "#fef2f2", color: "#dc2626" };
    return { backgroundColor: "#FDF8F5", color: "#C4907A" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-4">
          <span style={{fontSize: "13px", color: "#888"}}>{user?.user_metadata?.name} 📸</span>
          <button onClick={handleSignOut} style={{fontSize: "12px", color: "#888", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px", backgroundColor: "#fff", cursor: "pointer"}}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{maxWidth: "1000px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Welcome */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Photographer dashboard</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
            Your photography business
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>Manage your profile, bookings and earnings all in one place.</p>
        </div>

        {/* Profile card */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #f0f0f0", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px"}}>
          <div style={{width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FDF8F5", border: "1px solid #f0e8e0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
            <span style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#C4907A"}}>{user?.user_metadata?.name?.[0] || "?"}</span>
          </div>
          <div style={{flex: 1}}>
            <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{user?.user_metadata?.name || "Your name"}</p>
            <p style={{fontSize: "12px", color: "#888", margin: "0 0 2px"}}>{user?.user_metadata?.location || "No location set"}</p>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0"}}>{user?.user_metadata?.specialty || "No specialty set"}{user?.user_metadata?.price ? ` — ${user?.user_metadata?.price}` : ""}</p>
          </div>
          <a href="/photographer-dashboard/edit-profile" style={{fontSize: "12px", color: "#1a1a1a", border: "1px solid #e5e5e5", padding: "8px 20px", borderRadius: "20px", textDecoration: "none", backgroundColor: "#fff", flexShrink: 0}}>
            Edit profile
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total bookings", value: bookings.length, desc: "All time" },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, desc: "Awaiting response" },
            { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, desc: "Confirmed sessions" },
            { label: "Rating", value: "—", desc: "Average rating" },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #f0f0f0"}}>
              <p style={{fontSize: "11px", color: "#888", margin: "0 0 8px"}}>{stat.label}</p>
              <p style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-1px"}}>{stat.value}</p>
              <p style={{fontSize: "11px", color: "#C4907A", margin: "0"}}>{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Profile completion */}
        <div style={{backgroundColor: "#1a1a1a", borderRadius: "12px", padding: "32px", marginBottom: "32px"}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 6px", letterSpacing: "1px"}}>Profile strength</p>
              <h2 style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#fff", margin: "0"}}>Complete your profile</h2>
              <p style={{fontSize: "13px", color: "#888", margin: "4px 0 0"}}>A complete profile gets 3x more bookings</p>
            </div>
            <span style={{fontFamily: "Georgia, serif", fontSize: "40px", fontWeight: "700", color: "#C4907A", letterSpacing: "-1px"}}>{completion}%</span>
          </div>
          <div style={{width: "100%", backgroundColor: "#333", borderRadius: "4px", height: "4px", marginBottom: "24px"}}>
            <div style={{width: `${completion}%`, backgroundColor: "#C4907A", height: "4px", borderRadius: "4px", transition: "width 0.5s"}}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((item) => (
              <div key={item.task} className="flex items-center gap-3">
                <div style={{width: "20px", height: "20px", borderRadius: "50%", backgroundColor: item.done ? "#C4907A" : "transparent", border: item.done ? "none" : "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                  {item.done && <span style={{color: "#fff", fontSize: "11px"}}>✓</span>}
                </div>
                <span style={{fontSize: "13px", color: item.done ? "#666" : "#fff", textDecoration: item.done ? "line-through" : "none"}}>{item.task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0", marginBottom: "32px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 16px", letterSpacing: "1px"}}>Quick actions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: "👤", title: "Edit my profile", desc: "Update your bio, photos and prices", href: "/photographer-dashboard/edit-profile" },
              { icon: "🖼️", title: "My portfolio", desc: "Add and manage your photos", href: "#" },
              { icon: "📅", title: "My availability", desc: "Set your available days", href: "/photographer-dashboard/availability" },
              { icon: "💰", title: "Earnings", desc: "Track your income and payouts", href: "#" },
            ].map((action) => (
              <a key={action.title} href={action.href} style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #f0f0f0", borderRadius: "8px", textDecoration: "none", backgroundColor: "#FAFAF8"}}>
                <div style={{width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#C4907A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0}}>
                  {action.icon}
                </div>
                <div>
                  <p style={{fontSize: "14px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 2px"}}>{action.title}</p>
                  <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{action.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Booking requests */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Incoming</p>
          <h2 style={{fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 24px", letterSpacing: "-0.5px"}}>Booking requests</h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div style={{fontSize: "48px", marginBottom: "16px"}}>📭</div>
              <p style={{fontFamily: "Georgia, serif", fontSize: "18px", color: "#1a1a1a", margin: "0 0 8px"}}>No booking requests yet</p>
              <p style={{fontSize: "13px", color: "#888", margin: "0 0 24px"}}>Complete your profile to start receiving bookings</p>
              <a href="/photographer-dashboard/edit-profile" style={{backgroundColor: "#C4907A", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "24px", textDecoration: "none"}}>
                Complete my profile
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} style={{border: "1px solid #f0f0f0", borderRadius: "12px", padding: "20px", backgroundColor: "#FAFAF8"}}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{booking.client_name}</p>
                      <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{booking.client_email}</p>
                    </div>
                    <span style={{...getStatusStyle(booking.status), fontSize: "12px", padding: "4px 12px", borderRadius: "20px", fontWeight: "500"}}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 4px"}}>Session</p>
                      <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{booking.session_type}</p>
                    </div>
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
                  </div>
                  {booking.message && (
                    <div style={{backgroundColor: "#fff", border: "1px solid #f0e8e0", borderRadius: "8px", padding: "12px", marginBottom: "16px"}}>
                      <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 4px"}}>Message from client</p>
                      <p style={{fontSize: "13px", color: "#888", margin: "0", fontStyle: "italic", fontFamily: "Georgia, serif"}}>"{booking.message}"</p>
                    </div>
                  )}
                  {booking.status === "pending" && (
                    <div className="flex gap-3">
                      <button onClick={() => handleBookingStatus(booking.id, "confirmed")} style={{flex: 1, backgroundColor: "#1a1a1a", color: "#fff", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600"}}>
                        Accept booking
                      </button>
                      <button onClick={() => handleBookingStatus(booking.id, "declined")} style={{flex: 1, backgroundColor: "#fff", color: "#1a1a1a", padding: "10px", borderRadius: "8px", border: "1px solid #e5e5e5", cursor: "pointer", fontSize: "13px"}}>
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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