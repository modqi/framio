"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState("overview");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [applications, setApplications] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalPhotographers: 0,
    pendingApplications: 0,
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/studio-access"; return; }

      const { data: adminData } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!adminData) { window.location.href = "/studio-access"; return; }
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
        totalBookings: (bks || []).length,
        totalPhotographers: (photos || []).length,
        pendingApplications: (apps || []).filter((a: any) => a.status === "pending").length,
      });
      setLoading(false);
    };
    init();
  }, []);

  const handleApprove = async (app: any) => {
    await supabase.from("applications").update({ status: "approved" }).eq("id", app.id);
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: "approved" } : a));
    setStats(prev => ({ ...prev, pendingApplications: prev.pendingApplications - 1 }));

    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch("/api/approve-photographer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        email: app.email,
        name: app.name,
        location: app.location,
        specialty: app.specialty,
        price: "Price on request",
      }),
    });

    const result = await response.json();
    if (result.success) {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photographerName: app.name,
          photographerEmail: app.email,
          clientName: app.name,
          clientEmail: app.email,
          type: "photographer_approved",
          date: new Date().toLocaleDateString(),
          location: app.location,
          message: `Congratulations ${app.name}! Your application to join Lomissa has been approved.`,
          price: "Approved",
        }),
      });
    }
  };

  const handleReject = async (app: any) => {
    await supabase.from("applications").update({ status: "rejected" }).eq("id", app.id);
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: "rejected" } : a));
    setStats(prev => ({ ...prev, pendingApplications: prev.pendingApplications - 1 }));

    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photographerName: app.name,
        photographerEmail: app.email,
        clientName: app.name,
        clientEmail: app.email,
        type: "photographer_rejected",
        date: new Date().toLocaleDateString(),
        location: app.location,
        message: `Thank you for applying to Lomissa. After reviewing your application we have decided not to move forward at this time.`,
        price: "Application",
      }),
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
      <p style={{fontSize: "13px", color: "#B85528", fontFamily: "'Jost', sans-serif"}}>Loading...</p>
    </div>
  );

  if (!authorized) return null;

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: "8px 20px",
    borderRadius: "999px",
    fontSize: "13px",
    cursor: "pointer",
    border: "none",
    backgroundColor: tab === t ? "#B85528" : "transparent",
    color: tab === t ? "#FAF7F1" : "#7A5235",
    fontWeight: tab === t ? "500" : "400",
    fontFamily: "'Jost', sans-serif",
  });

  const statusBadge = (status: string): React.CSSProperties => ({
    fontSize: "11px",
    padding: "4px 12px",
    borderRadius: "999px",
    fontWeight: "500",
    fontFamily: "'Jost', sans-serif",
    backgroundColor: status === "approved" ? "#f0fdf4" : status === "rejected" ? "#fef2f2" : "#FBF0EA",
    color: status === "approved" ? "#15803d" : status === "rejected" ? "#dc2626" : "#B85528",
  });

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span style={{fontSize: "11px", letterSpacing: "0.15em", color: "#B85528", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" style={{fontSize: "12px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>View site</a>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = "/studio-access")}
            style={{fontSize: "12px", color: "#7A5235", border: "1px solid #E4D8C4", padding: "6px 16px", borderRadius: "999px", backgroundColor: "transparent", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ADMIN PANEL</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1C1009", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            Lomissa HQ
          </h1>
          <p style={{fontSize: "14px", color: "#7A5235", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>Manage your platform from one place</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total bookings", value: stats.totalBookings },
            { label: "Photographers", value: stats.totalPhotographers },
            { label: "Pending applications", value: stats.pendingApplications },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "24px", border: "1px solid #E4D8C4"}}>
              <p style={{fontSize: "12px", color: "#9E7250", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{stat.label}</p>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1C1009", margin: "0", letterSpacing: "-0.02em"}}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display: "flex", gap: "8px", marginBottom: "32px", backgroundColor: "#F5EFE4", padding: "4px", borderRadius: "999px", width: "fit-content"}}>
          {[
            { key: "overview", label: "Overview" },
            { key: "applications", label: `Applications (${stats.pendingApplications})` },
            { key: "photographers", label: "Photographers" },
            { key: "bookings", label: "Bookings" },
          ].map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(0); }} style={tabStyle(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "24px", border: "1px solid #E4D8C4"}}>
              <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>RECENT APPLICATIONS</p>
              {applications.slice(0, 3).length === 0 ? (
                <p style={{fontSize: "13px", color: "#C3AB88", fontStyle: "italic", fontFamily: "'Jost', sans-serif"}}>No applications yet</p>
              ) : applications.slice(0, 3).map((app) => (
                <div key={app.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #E4D8C4"}}>
                  <div>
                    <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "16px", fontWeight: "500", color: "#1C1009", margin: "0 0 2px"}}>{app.name}</p>
                    <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{app.specialty} — {app.location}</p>
                  </div>
                  <span style={statusBadge(app.status)}>{app.status}</span>
                </div>
              ))}
              <button onClick={() => setTab("applications")} style={{marginTop: "16px", fontSize: "12px", color: "#B85528", background: "none", border: "none", cursor: "pointer", padding: "0", fontFamily: "'Jost', sans-serif"}}>
                View all applications →
              </button>
            </div>

            <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "24px", border: "1px solid #E4D8C4"}}>
              <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>RECENT BOOKINGS</p>
              {bookings.slice(0, 3).length === 0 ? (
                <p style={{fontSize: "13px", color: "#C3AB88", fontStyle: "italic", fontFamily: "'Jost', sans-serif"}}>No bookings yet</p>
              ) : bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #E4D8C4"}}>
                  <div>
                    <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "16px", fontWeight: "500", color: "#1C1009", margin: "0 0 2px"}}>{booking.client_name || "Client"}</p>
                    <p style={{fontSize: "12px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.photographer_name} — {booking.date}</p>
                  </div>
                  <span style={statusBadge(booking.status)}>{booking.status}</span>
                </div>
              ))}
              <button onClick={() => setTab("bookings")} style={{marginTop: "16px", fontSize: "12px", color: "#B85528", background: "none", border: "none", cursor: "pointer", padding: "0", fontFamily: "'Jost', sans-serif"}}>
                View all bookings →
              </button>
            </div>
          </div>
        )}

        {/* Applications */}
        {tab === "applications" && (
          <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4"}}>
            <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 24px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ALL APPLICATIONS — {applications.length} TOTAL</p>
            {applications.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#C3AB88", fontStyle: "italic"}}>No applications yet</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {applications.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((app) => (
                  <div key={app.id} style={{border: "1px solid #E4D8C4", borderRadius: "12px", padding: "20px", backgroundColor: "#FAF7F1"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px"}}>
                      <div>
                        <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1C1009", margin: "0 0 4px"}}>{app.name}</p>
                        <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{app.email} — {app.location}</p>
                        <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                          {app.specialty && <span style={{fontSize: "11px", color: "#B85528", border: "1px solid #E4D8C4", padding: "2px 10px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>{app.specialty}</span>}
                          {app.experience && <span style={{fontSize: "11px", color: "#9E7250", border: "1px solid #E4D8C4", padding: "2px 10px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>{app.experience}</span>}
                        </div>
                      </div>
                      <span style={statusBadge(app.status)}>{app.status}</span>
                    </div>
                    {app.about && (
                      <p style={{fontSize: "14px", color: "#7A5235", margin: "12px 0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: "1.7"}}>"{app.about}"</p>
                    )}
                    <div style={{display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px"}}>
                      {app.instagram && (
                        <a href={`https://instagram.com/${app.instagram}`} target="_blank" style={{fontSize: "12px", color: "#B85528", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>@{app.instagram} ↗</a>
                      )}
                      {app.portfolio_link && (
                        <a href={app.portfolio_link} target="_blank" style={{fontSize: "12px", color: "#B85528", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Portfolio ↗</a>
                      )}
                    </div>
                    {app.status === "pending" && (
                      <div style={{display: "flex", gap: "8px", marginTop: "16px"}}>
                        <button onClick={() => handleApprove(app)} style={{backgroundColor: "#1C1009", color: "#FAF7F1", fontSize: "12px", padding: "8px 20px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}>
                          Approve ✓
                        </button>
                        <button onClick={() => handleReject(app)} style={{backgroundColor: "transparent", color: "#dc2626", fontSize: "12px", padding: "8px 20px", border: "1px solid #fce8e8", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>
                          Reject ✗
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {applications.length > PAGE_SIZE && (
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", justifyContent: "center"}}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{fontSize: "12px", color: page === 0 ? "#C3AB88" : "#7A5235", background: "none", border: "1px solid #E4D8C4", borderRadius: "999px", padding: "6px 16px", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>← Prev</button>
                <span style={{fontSize: "12px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>Page {page + 1} of {Math.ceil(applications.length / PAGE_SIZE)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= applications.length} style={{fontSize: "12px", color: (page + 1) * PAGE_SIZE >= applications.length ? "#C3AB88" : "#7A5235", background: "none", border: "1px solid #E4D8C4", borderRadius: "999px", padding: "6px 16px", cursor: (page + 1) * PAGE_SIZE >= applications.length ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>Next →</button>
              </div>
            )}
          </div>
        )}

        {/* Photographers */}
        {tab === "photographers" && (
          <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4"}}>
            <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 24px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ALL PHOTOGRAPHERS — {photographers.length} TOTAL</p>
            {photographers.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#C3AB88", fontStyle: "italic"}}>No photographers yet</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                {photographers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((p) => (
                  <div key={p.id} style={{border: "1px solid #E4D8C4", borderRadius: "12px", padding: "20px", backgroundColor: "#FAF7F1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px"}}>
                    <div>
                      <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1C1009", margin: "0 0 4px"}}>{p.name}</p>
                      <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{p.location} — {p.specialty}</p>
                      <p style={{fontSize: "13px", color: "#B85528", margin: "0", fontFamily: "'Jost', sans-serif"}}>{p.price} — ⭐ {p.rating || "New"}</p>
                    </div>
                    <a href={`/photographers/${p.id}`} target="_blank" style={{fontSize: "12px", color: "#7A5235", textDecoration: "none", border: "1px solid #E4D8C4", padding: "6px 16px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>
                      View profile →
                    </a>
                  </div>
                ))}
              </div>
            )}
            {photographers.length > PAGE_SIZE && (
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", justifyContent: "center"}}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{fontSize: "12px", color: page === 0 ? "#C3AB88" : "#7A5235", background: "none", border: "1px solid #E4D8C4", borderRadius: "999px", padding: "6px 16px", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>← Prev</button>
                <span style={{fontSize: "12px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>Page {page + 1} of {Math.ceil(photographers.length / PAGE_SIZE)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= photographers.length} style={{fontSize: "12px", color: (page + 1) * PAGE_SIZE >= photographers.length ? "#C3AB88" : "#7A5235", background: "none", border: "1px solid #E4D8C4", borderRadius: "999px", padding: "6px 16px", cursor: (page + 1) * PAGE_SIZE >= photographers.length ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>Next →</button>
              </div>
            )}
          </div>
        )}

        {/* Bookings */}
        {tab === "bookings" && (
          <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4"}}>
            <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 24px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ALL BOOKINGS — {bookings.length} TOTAL</p>
            {bookings.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#C3AB88", fontStyle: "italic"}}>No bookings yet</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                {bookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((booking) => (
                  <div key={booking.id} style={{border: "1px solid #E4D8C4", borderRadius: "12px", padding: "20px", backgroundColor: "#FAF7F1"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px"}}>
                      <div>
                        <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1C1009", margin: "0 0 4px"}}>{booking.client_name} → {booking.photographer_name}</p>
                        <p style={{fontSize: "13px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.session_type} — {booking.date} — {booking.location}</p>
                      </div>
                      <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                        <span style={statusBadge(booking.status)}>{booking.status}</span>
                        <span style={{fontSize: "13px", fontWeight: "500", color: "#1C1009", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>{booking.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bookings.length > PAGE_SIZE && (
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", justifyContent: "center"}}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{fontSize: "12px", color: page === 0 ? "#C3AB88" : "#7A5235", background: "none", border: "1px solid #E4D8C4", borderRadius: "999px", padding: "6px 16px", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>← Prev</button>
                <span style={{fontSize: "12px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>Page {page + 1} of {Math.ceil(bookings.length / PAGE_SIZE)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= bookings.length} style={{fontSize: "12px", color: (page + 1) * PAGE_SIZE >= bookings.length ? "#C3AB88" : "#7A5235", background: "none", border: "1px solid #E4D8C4", borderRadius: "999px", padding: "6px 16px", cursor: (page + 1) * PAGE_SIZE >= bookings.length ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}