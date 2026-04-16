"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState("overview");
  const [applications, setApplications] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalPhotographers: 0,
    pendingApplications: 0,
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: adminData } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!adminData) { window.location.href = "/"; return; }
      setAuthorized(true);

      const [
        { data: apps },
        { data: bks },
        { data: photos },
      ] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("photographers").select("*").order("created_at", { ascending: false }),
      ]);

      setApplications(apps || []);
      setBookings(bks || []);
      setPhotographers(photos || []);
      setStats({
        totalUsers: 6,
        totalBookings: (bks || []).length,
        totalPhotographers: (photos || []).length,
        pendingApplications: (apps || []).filter((a: any) => a.status === "pending").length,
      });
      setLoading(false);
    };
    init();
  }, []);

  const updateApplicationStatus = async (id: string, status: string) => {
    await supabase.from("applications").update({ status }).eq("id", id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const togglePhotographer = async (id: string, active: boolean) => {
    await supabase.from("photographers").update({ active }).eq("id", id);
    setPhotographers(prev => prev.map(p => p.id === id ? { ...p, active } : p));
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading admin panel...</p>
    </div>
  );

  if (!authorized) return null;

  const tabStyle = (t: string) => ({
    padding: "8px 20px",
    borderRadius: "20px",
    fontSize: "13px",
    cursor: "pointer",
    border: "none",
    backgroundColor: tab === t ? "#1a1a1a" : "transparent",
    color: tab === t ? "#fff" : "#888",
    fontWeight: tab === t ? "600" : "400",
  });

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>View site</a>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")} style={{fontSize: "12px", color: "#888", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px", backgroundColor: "#fff", cursor: "pointer"}}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Admin panel</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
            Framio HQ
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>Manage your platform from one place</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total users", value: stats.totalUsers, color: "#1a1a1a" },
            { label: "Total bookings", value: stats.totalBookings, color: "#1a1a1a" },
            { label: "Photographers", value: stats.totalPhotographers, color: "#1a1a1a" },
            { label: "Pending applications", value: stats.pendingApplications, color: "#C4907A" },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #f0f0f0"}}>
              <p style={{fontSize: "12px", color: "#888", margin: "0 0 8px"}}>{stat.label}</p>
              <p style={{fontFamily: "Georgia, serif", fontSize: "40px", fontWeight: "700", color: stat.color, margin: "0", letterSpacing: "-1px"}}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display: "flex", gap: "8px", marginBottom: "32px", backgroundColor: "#fff", padding: "8px", borderRadius: "32px", border: "1px solid #f0f0f0", width: "fit-content"}}>
          {[
            { key: "overview", label: "Overview" },
            { key: "applications", label: `Applications (${stats.pendingApplications})` },
            { key: "photographers", label: "Photographers" },
            { key: "bookings", label: "Bookings" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #f0f0f0"}}>
              <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 16px", letterSpacing: "1px"}}>Recent applications</p>
              {applications.slice(0, 3).map((app) => (
                <div key={app.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0"}}>
                  <div>
                    <p style={{fontSize: "14px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 2px"}}>{app.name}</p>
                    <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{app.specialty} — {app.location}</p>
                  </div>
                  <span style={{fontSize: "11px", padding: "4px 10px", borderRadius: "20px", backgroundColor: app.status === "approved" ? "#f0fdf4" : app.status === "rejected" ? "#fef2f2" : "#FDF8F5", color: app.status === "approved" ? "#15803d" : app.status === "rejected" ? "#dc2626" : "#C4907A"}}>
                    {app.status}
                  </span>
                </div>
              ))}
              <button onClick={() => setTab("applications")} style={{marginTop: "16px", fontSize: "12px", color: "#C4907A", background: "none", border: "none", cursor: "pointer", padding: "0"}}>
                View all applications →
              </button>
            </div>

            <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #f0f0f0"}}>
              <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 16px", letterSpacing: "1px"}}>Recent bookings</p>
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0"}}>
                  <div>
                    <p style={{fontSize: "14px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 2px"}}>{booking.client_name || "Client"}</p>
                    <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{booking.photographer_name} — {booking.date}</p>
                  </div>
                  <span style={{fontSize: "11px", padding: "4px 10px", borderRadius: "20px", backgroundColor: booking.status === "confirmed" ? "#f0fdf4" : booking.status === "declined" ? "#fef2f2" : "#FDF8F5", color: booking.status === "confirmed" ? "#15803d" : booking.status === "declined" ? "#dc2626" : "#C4907A"}}>
                    {booking.status}
                  </span>
                </div>
              ))}
              <button onClick={() => setTab("bookings")} style={{marginTop: "16px", fontSize: "12px", color: "#C4907A", background: "none", border: "none", cursor: "pointer", padding: "0"}}>
                View all bookings →
              </button>
            </div>
          </div>
        )}

        {/* Applications */}
        {tab === "applications" && (
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 24px", letterSpacing: "1px"}}>All applications — {applications.length} total</p>
            {applications.length === 0 ? (
              <p style={{fontFamily: "Georgia, serif", fontSize: "16px", color: "#aaa", fontStyle: "italic"}}>No applications yet</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {applications.map((app) => (
                  <div key={app.id} style={{border: "1px solid #f0f0f0", borderRadius: "12px", padding: "20px", backgroundColor: "#FAFAF8"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px"}}>
                      <div>
                        <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{app.name}</p>
                        <p style={{fontSize: "13px", color: "#888", margin: "0 0 8px"}}>{app.email} — {app.location}</p>
                        <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                          {app.specialty && <span style={{fontSize: "11px", color: "#C4907A", border: "1px solid #f0e8e0", padding: "2px 10px", borderRadius: "20px"}}>{app.specialty}</span>}
                          {app.experience && <span style={{fontSize: "11px", color: "#888", border: "1px solid #f0f0f0", padding: "2px 10px", borderRadius: "20px"}}>{app.experience}</span>}
                        </div>
                      </div>
                      <span style={{fontSize: "11px", padding: "4px 12px", borderRadius: "20px", backgroundColor: app.status === "approved" ? "#f0fdf4" : app.status === "rejected" ? "#fef2f2" : "#FDF8F5", color: app.status === "approved" ? "#15803d" : app.status === "rejected" ? "#dc2626" : "#C4907A", fontWeight: "500"}}>
                        {app.status}
                      </span>
                    </div>

                    {app.about && (
                      <p style={{fontSize: "13px", color: "#555", margin: "12px 0", fontStyle: "italic", fontFamily: "Georgia, serif", lineHeight: "1.7"}}>"{app.about}"</p>
                    )}

                    <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px"}}>
                      {app.instagram && (
                        <a href={`https://instagram.com/${app.instagram}`} target="_blank" style={{fontSize: "12px", color: "#C4907A", textDecoration: "none"}}>@{app.instagram}</a>
                      )}
                      {app.portfolio_link && (
                        <a href={app.portfolio_link} target="_blank" style={{fontSize: "12px", color: "#C4907A", textDecoration: "none"}}>Portfolio →</a>
                      )}
                    </div>

                    {app.status === "pending" && (
                      <div style={{display: "flex", gap: "8px", marginTop: "16px"}}>
                        <button onClick={() => updateApplicationStatus(app.id, "approved")} style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "12px", padding: "8px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600"}}>
                          Approve ✓
                        </button>
                        <button onClick={() => updateApplicationStatus(app.id, "rejected")} style={{backgroundColor: "#fff", color: "#dc2626", fontSize: "12px", padding: "8px 20px", border: "1px solid #fce8e8", borderRadius: "8px", cursor: "pointer"}}>
                          Reject ✗
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photographers */}
        {tab === "photographers" && (
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 24px", letterSpacing: "1px"}}>All photographers — {photographers.length} total</p>
            {photographers.length === 0 ? (
              <p style={{fontFamily: "Georgia, serif", fontSize: "16px", color: "#aaa", fontStyle: "italic"}}>No photographers yet</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {photographers.map((p) => (
                  <div key={p.id} style={{border: "1px solid #f0f0f0", borderRadius: "12px", padding: "20px", backgroundColor: "#FAFAF8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px"}}>
                    <div>
                      <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{p.name}</p>
                      <p style={{fontSize: "13px", color: "#888", margin: "0 0 4px"}}>{p.location} — {p.specialty}</p>
                      <p style={{fontSize: "13px", color: "#C4907A", margin: "0"}}>{p.price} — ⭐ {p.rating || "New"}</p>
                    </div>
                    <div style={{display: "flex", gap: "8px", alignItems: "center"}}>
                      <a href={`/photographers/${p.id}`} target="_blank" style={{fontSize: "12px", color: "#888", textDecoration: "none", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px"}}>
                        View profile
                      </a>
                      <button
                        onClick={() => togglePhotographer(p.id, !p.active)}
                        style={{fontSize: "12px", padding: "6px 16px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: p.active === false ? "#f0fdf4" : "#fef2f2", color: p.active === false ? "#15803d" : "#dc2626", fontWeight: "500"}}
                      >
                        {p.active === false ? "Activate" : "Deactivate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings */}
        {tab === "bookings" && (
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 24px", letterSpacing: "1px"}}>All bookings — {bookings.length} total</p>
            {bookings.length === 0 ? (
              <p style={{fontFamily: "Georgia, serif", fontSize: "16px", color: "#aaa", fontStyle: "italic"}}>No bookings yet</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {bookings.map((b) => (
                  <div key={b.id} style={{border: "1px solid #f0f0f0", borderRadius: "12px", padding: "20px", backgroundColor: "#FAFAF8"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px"}}>
                      <div>
                        <p style={{fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{b.client_name || "Client"} → {b.photographer_name}</p>
                        <p style={{fontSize: "13px", color: "#888", margin: "0"}}>{b.session_type} — {b.date}</p>
                      </div>
                      <span style={{fontSize: "11px", padding: "4px 12px", borderRadius: "20px", backgroundColor: b.status === "confirmed" ? "#f0fdf4" : b.status === "declined" ? "#fef2f2" : "#FDF8F5", color: b.status === "confirmed" ? "#15803d" : b.status === "declined" ? "#dc2626" : "#C4907A", fontWeight: "500"}}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{display: "flex", gap: "24px", flexWrap: "wrap"}}>
                      <div>
                        <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 2px"}}>Price</p>
                        <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{b.price}</p>
                      </div>
                      <div>
                        <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 2px"}}>Location</p>
                        <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{b.location || "Not set"}</p>
                      </div>
                      <div>
                        <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 2px"}}>Client email</p>
                        <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{b.client_email}</p>
                      </div>
                      <div>
                        <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 2px"}}>Booked on</p>
                        <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0"}}>{new Date(b.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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