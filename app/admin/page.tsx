"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function AdminPanel() {
  const t = useTranslations("Admin");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState("overview");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [applications, setApplications] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalPhotographers: 0,
    totalClients: 0,
    pendingApplications: 0,
    openDisputes: 0,
  });
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      if (user.user_metadata?.role !== "admin") { window.location.href = "/login"; return; }

      const { data: adminData } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!adminData) { window.location.href = "/login"; return; }
      setAuthorized(true);

      const { data: { session } } = await supabase.auth.getSession();

      const [
        { data: apps },
        { data: bks },
        { data: photos },
        clientsRes,
      ] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("photographers").select("*").order("created_at", { ascending: false }),
        fetch("/api/admin/clients", {
          headers: { "Authorization": `Bearer ${session?.access_token ?? ""}` },
        }).then((r) => r.json()).catch(() => ({ clients: [] })),
      ]);

      setApplications(apps || []);
      setBookings(bks || []);
      setPhotographers(photos || []);
      setClients(clientsRes.clients || []);
      setStats({
        totalBookings: (bks || []).length,
        totalPhotographers: (photos || []).length,
        totalClients: (clientsRes.clients || []).length,
        pendingApplications: (apps || []).filter((a: any) => a.status === "pending").length,
        openDisputes: (bks || []).filter((b: any) => b.status === "disputed").length,
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
          onboardingUrl: result.onboardingUrl,
        }),
      });
    }
  };

  const handleResolveDispute = async (bookingId: string, action: "release" | "refund") => {
    setResolvingId(bookingId + action);
    setResolveError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin-resolve-dispute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          bookingId,
          action,
          adminNote: disputeNotes[bookingId] || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResolveError(data.error || "Failed to resolve dispute.");
      } else {
        const newStatus = action === "release" ? "paid_out" : "cancelled";
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        setStats(prev => ({ ...prev, openDisputes: prev.openDisputes - 1 }));
      }
    } catch {
      setResolveError(t("disputes.error"));
    }
    setResolvingId(null);
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
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>{t("loading")}</p>
    </div>
  );

  if (!authorized) return null;

  const tabStyle = (key: string): React.CSSProperties => ({
    padding: "8px 20px",
    borderRadius: "999px",
    fontSize: "13px",
    cursor: "pointer",
    border: "none",
    backgroundColor: tab === key ? "#C8622A" : "transparent",
    color: tab === key ? "#FDFBF8" : "#7A5C44",
    fontWeight: tab === key ? "500" : "400",
    fontFamily: "'Jost', sans-serif",
  });

  const statusBadge = (status: string): React.CSSProperties => ({
    fontSize: "11px",
    padding: "4px 12px",
    borderRadius: "999px",
    fontWeight: "500",
    fontFamily: "'Jost', sans-serif",
    backgroundColor: status === "approved" ? "#f0fdf4" : status === "rejected" ? "#fef2f2" : "#FBF0EA",
    color: status === "approved" ? "#15803d" : status === "rejected" ? "#dc2626" : "#C8622A",
  });

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span style={{fontSize: "11px", letterSpacing: "0.15em", color: "#C8622A", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("nav.badge")}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("nav.viewSite")}</a>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = "/studio-access")}
            style={{fontSize: "12px", color: "#7A5C44", border: "1px solid #E2D5C8", padding: "6px 16px", borderRadius: "999px", backgroundColor: "transparent", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
          >
            {t("nav.signOut")}
          </button>
        </div>
      </nav>

      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("header.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {t("header.title")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t("header.description")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: t("stats.totalBookings"), value: stats.totalBookings },
            { label: t("stats.photographers"), value: stats.totalPhotographers },
            { label: t("stats.clients"), value: stats.totalClients },
            { label: t("stats.pendingApplications"), value: stats.pendingApplications },
            { label: t("stats.openDisputes"), value: stats.openDisputes },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "24px", border: "1px solid #E2D5C8"}}>
              <p style={{fontSize: "12px", color: "#7A5C44", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{stat.label}</p>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1A0E06", margin: "0", letterSpacing: "-0.02em"}}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display: "flex", gap: "8px", marginBottom: "32px", backgroundColor: "#F5EFE4", padding: "4px", borderRadius: "999px", width: "fit-content", flexWrap: "wrap"}}>
          {[
            { key: "overview", label: t("tabs.overview") },
            { key: "applications", label: t("tabs.applications", { count: stats.pendingApplications } as any) },
            { key: "photographers", label: t("tabs.photographers") },
            { key: "clients", label: t("tabs.clients", { count: stats.totalClients } as any) },
            { key: "bookings", label: t("tabs.bookings") },
            { key: "disputes", label: t("tabs.disputes", { count: stats.openDisputes } as any) },
          ].map((tab_item) => (
            <button key={tab_item.key} onClick={() => { setTab(tab_item.key); setPage(0); }} style={tabStyle(tab_item.key)}>{tab_item.label}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "24px", border: "1px solid #E2D5C8"}}>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("overview.recentApplications")}</p>
              {applications.slice(0, 3).length === 0 ? (
                <p style={{fontSize: "13px", color: "#DDD0C0", fontStyle: "italic", fontFamily: "'Jost', sans-serif"}}>{t("overview.noApplications")}</p>
              ) : applications.slice(0, 3).map((app) => (
                <div key={app.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #E2D5C8"}}>
                  <div>
                    <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "16px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px"}}>{app.name}</p>
                    <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{app.specialty} — {app.location}</p>
                  </div>
                  <span style={statusBadge(app.status)}>{app.status}</span>
                </div>
              ))}
              <button onClick={() => setTab("applications")} style={{marginTop: "16px", fontSize: "12px", color: "#C8622A", background: "none", border: "none", cursor: "pointer", padding: "0", fontFamily: "'Jost', sans-serif"}}>
                {t("overview.viewAllApplications")}
              </button>
            </div>

            <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "24px", border: "1px solid #E2D5C8"}}>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("overview.recentBookings")}</p>
              {bookings.slice(0, 3).length === 0 ? (
                <p style={{fontSize: "13px", color: "#DDD0C0", fontStyle: "italic", fontFamily: "'Jost', sans-serif"}}>{t("overview.noBookings")}</p>
              ) : bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #E2D5C8"}}>
                  <div>
                    <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "16px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px"}}>{booking.client_name || "Client"}</p>
                    <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.photographer_name} — {booking.date}</p>
                  </div>
                  <span style={statusBadge(booking.status)}>{booking.status}</span>
                </div>
              ))}
              <button onClick={() => setTab("bookings")} style={{marginTop: "16px", fontSize: "12px", color: "#C8622A", background: "none", border: "none", cursor: "pointer", padding: "0", fontFamily: "'Jost', sans-serif"}}>
                {t("overview.viewAllBookings")}
              </button>
            </div>
          </div>
        )}

        {/* Applications */}
        {tab === "applications" && (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 24px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("applications.sectionTitle", { count: applications.length } as any)}</p>
            {applications.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#DDD0C0", fontStyle: "italic"}}>{t("applications.noApplications")}</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {applications.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((app) => (
                  <div key={app.id} style={{border: "1px solid #E2D5C8", borderRadius: "12px", padding: "20px", backgroundColor: "#FDFBF8"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px"}}>
                      <div>
                        <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{app.name}</p>
                        <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{app.email} — {app.location}</p>
                        <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                          {app.specialty && <span style={{fontSize: "11px", color: "#C8622A", border: "1px solid #E2D5C8", padding: "2px 10px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>{app.specialty}</span>}
                          {app.experience && <span style={{fontSize: "11px", color: "#7A5C44", border: "1px solid #E2D5C8", padding: "2px 10px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>{app.experience}</span>}
                        </div>
                      </div>
                      <span style={statusBadge(app.status)}>{app.status}</span>
                    </div>
                    {app.about && (
                      <p style={{fontSize: "14px", color: "#7A5C44", margin: "12px 0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: "1.7"}}>"{app.about}"</p>
                    )}
                    <div style={{display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px"}}>
                      {app.instagram && (
                        <a href={`https://instagram.com/${app.instagram}`} target="_blank" style={{fontSize: "12px", color: "#C8622A", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>@{app.instagram} ↗</a>
                      )}
                      {app.portfolio_link && (
                        <a href={app.portfolio_link} target="_blank" style={{fontSize: "12px", color: "#C8622A", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("applications.portfolio")}</a>
                      )}
                    </div>
                    {app.status === "pending" && (
                      <div style={{display: "flex", gap: "8px", marginTop: "16px"}}>
                        <button onClick={() => handleApprove(app)} style={{backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "12px", padding: "8px 20px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}>
                          {t("applications.approve")}
                        </button>
                        <button onClick={() => handleReject(app)} style={{backgroundColor: "transparent", color: "#dc2626", fontSize: "12px", padding: "8px 20px", border: "1px solid #fce8e8", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>
                          {t("applications.reject")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {applications.length > PAGE_SIZE && (
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", justifyContent: "center"}}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{fontSize: "12px", color: page === 0 ? "#DDD0C0" : "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>{t("pagination.prev")}</button>
                <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("pagination.page", { current: page + 1, total: Math.ceil(applications.length / PAGE_SIZE) } as any)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= applications.length} style={{fontSize: "12px", color: (page + 1) * PAGE_SIZE >= applications.length ? "#DDD0C0" : "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", cursor: (page + 1) * PAGE_SIZE >= applications.length ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>{t("pagination.next")}</button>
              </div>
            )}
          </div>
        )}

        {/* Photographers */}
        {tab === "photographers" && (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 24px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("photographers.sectionTitle", { count: photographers.length } as any)}</p>
            {photographers.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#DDD0C0", fontStyle: "italic"}}>{t("photographers.noPhotographers")}</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                {photographers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((p) => (
                  <div key={p.id} style={{border: "1px solid #E2D5C8", borderRadius: "12px", padding: "20px", backgroundColor: "#FDFBF8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px"}}>
                    <div>
                      <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{p.name}</p>
                      <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{p.location} — {p.specialty}</p>
                      <p style={{fontSize: "13px", color: "#C8622A", margin: "0", fontFamily: "'Jost', sans-serif"}}>{p.price} — <svg viewBox="0 0 64 64" width="14" height="14" fill="none" style={{display:"inline-block",verticalAlign:"middle",marginRight:"3px"}}><circle cx="32" cy="32" r="9" fill="#C8622A"/><line x1="32" y1="18" x2="32" y2="10" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="46" y1="32" x2="54" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="42" y1="22" x2="48" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="22" x2="16" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/></svg>{p.rating || "New"}</p>
                    </div>
                    <a href={`/photographers/${p.id}`} target="_blank" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", border: "1px solid #E2D5C8", padding: "6px 16px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>
                      {t("photographers.viewProfile")}
                    </a>
                  </div>
                ))}
              </div>
            )}
            {photographers.length > PAGE_SIZE && (
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", justifyContent: "center"}}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{fontSize: "12px", color: page === 0 ? "#DDD0C0" : "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>{t("pagination.prev")}</button>
                <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("pagination.page", { current: page + 1, total: Math.ceil(photographers.length / PAGE_SIZE) } as any)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= photographers.length} style={{fontSize: "12px", color: (page + 1) * PAGE_SIZE >= photographers.length ? "#DDD0C0" : "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", cursor: (page + 1) * PAGE_SIZE >= photographers.length ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>{t("pagination.next")}</button>
              </div>
            )}
          </div>
        )}

        {/* Clients */}
        {tab === "clients" && (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 24px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
              {t("clients.sectionTitle", { count: clients.length } as any)}
              {clients.filter(c => c.pending_deletion).length > 0 && (
                <span style={{marginLeft: "12px", color: "#dc2626"}}>
                  {t("clients.pendingDeletion", { count: clients.filter(c => c.pending_deletion).length } as any)}
                </span>
              )}
            </p>
            {clients.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#DDD0C0", fontStyle: "italic"}}>{t("clients.noClients")}</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                {clients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((client) => {
                  const clientBookings = bookings.filter(b => b.client_id === client.id);
                  const isExpanded = expandedClientId === client.id;
                  return (
                    <div key={client.id} style={{border: client.pending_deletion ? "1px solid #fecaca" : "1px solid #E2D5C8", borderRadius: "12px", padding: "20px", backgroundColor: client.pending_deletion ? "#fff8f8" : "#FDFBF8"}}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px"}}>
                        <div>
                          <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>
                            {client.name || <span style={{color: "#DDD0C0", fontStyle: "italic"}}>{t("clients.noName")}</span>}
                          </p>
                          <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{client.email}</p>
                          <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                            {t("clients.joined", { date: new Date(client.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) } as any)}
                          </p>
                        </div>
                        <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px"}}>
                          <div style={{display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end"}}>
                            <span style={{fontSize: "11px", padding: "4px 12px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif", backgroundColor: "#F5EFE4", color: "#7A5C44"}}>
                              {t("clients.bookingCount", { count: client.booking_count } as any)}
                            </span>
                            {client.pending_deletion ? (
                              <span style={{fontSize: "11px", padding: "4px 12px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif", backgroundColor: "#fef2f2", color: "#dc2626"}}>
                                {t("clients.pendingDeletionBadge")}
                              </span>
                            ) : (
                              <span style={{fontSize: "11px", padding: "4px 12px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif", backgroundColor: "#f0fdf4", color: "#15803d"}}>
                                {t("clients.activeBadge")}
                              </span>
                            )}
                          </div>
                          {client.pending_deletion && client.scheduled_deletion_at && (
                            <p style={{fontSize: "11px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                              {t("clients.deletesOn", { date: new Date(client.scheduled_deletion_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) } as any)}
                            </p>
                          )}
                        </div>
                      </div>
                      {client.booking_count > 0 && (
                        <div style={{marginTop: "12px"}}>
                          <button
                            onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                            style={{fontSize: "12px", color: "#C8622A", background: "none", border: "none", cursor: "pointer", padding: "0", fontFamily: "'Jost', sans-serif"}}
                          >
                            {isExpanded ? t("clients.hideHistory") : t("clients.viewHistory", { count: client.booking_count } as any)}
                          </button>
                          {isExpanded && (
                            <div style={{marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px"}}>
                              {clientBookings.map((b) => (
                                <div key={b.id} style={{backgroundColor: "#FDFBF8", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px"}}>
                                  <div>
                                    <p style={{fontSize: "13px", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{b.session_type} with {b.photographer_name}</p>
                                    <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{b.date || t("clients.noDate")} · {b.price}</p>
                                  </div>
                                  <span style={statusBadge(b.status)}>{b.status}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {clients.length > PAGE_SIZE && (
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", justifyContent: "center"}}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{fontSize: "12px", color: page === 0 ? "#DDD0C0" : "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>{t("pagination.prev")}</button>
                <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("pagination.page", { current: page + 1, total: Math.ceil(clients.length / PAGE_SIZE) } as any)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= clients.length} style={{fontSize: "12px", color: (page + 1) * PAGE_SIZE >= clients.length ? "#DDD0C0" : "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", cursor: (page + 1) * PAGE_SIZE >= clients.length ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>{t("pagination.next")}</button>
              </div>
            )}
          </div>
        )}

        {/* Disputes */}
        {tab === "disputes" && (() => {
          const disputes = bookings.filter(b => b.status === "disputed");
          return (
            <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("disputes.sectionTitle", { count: disputes.length } as any)}</p>
              <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "26px", fontWeight: "400", color: "#1A0E06", margin: "0 0 24px", letterSpacing: "-0.02em"}}>
                {t("disputes.heading")}
              </h2>
              {resolveError && (
                <div style={{marginBottom: "16px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fce8e8"}}>
                  <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{resolveError}</p>
                </div>
              )}
              {disputes.length === 0 ? (
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#DDD0C0", fontStyle: "italic"}}>{t("disputes.noDisputes")}</p>
              ) : (
                <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                  {disputes.map((booking) => (
                    <div key={booking.id} style={{border: "1px solid #fde68a", borderRadius: "12px", padding: "24px", backgroundColor: "#fffbeb"}}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px"}}>
                        <div>
                          <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{booking.client_name} → {booking.photographer_name}</p>
                          <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{booking.session_type} — {booking.date} — {booking.price}</p>
                          <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.client_email} · {booking.photographer_email}</p>
                        </div>
                        <span style={{fontSize: "11px", padding: "4px 12px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif", backgroundColor: "#fef3c7", color: "#b45309"}}>Disputed</span>
                      </div>
                      {booking.dispute_reason && (
                        <div style={{backgroundColor: "#FDFBF8", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px"}}>
                          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("disputes.clientReason")}</p>
                          <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: "1.6"}}>"{booking.dispute_reason}"</p>
                        </div>
                      )}
                      <div style={{marginBottom: "16px"}}>
                        <label style={{display: "block", fontSize: "11px", color: "#7A5C44", margin: "0 0 8px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("disputes.adminNote")}</label>
                        <textarea
                          value={disputeNotes[booking.id] || ""}
                          onChange={(e) => setDisputeNotes(prev => ({ ...prev, [booking.id]: e.target.value }))}
                          placeholder={t("disputes.adminNotePlaceholder")}
                          rows={2}
                          style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", fontFamily: "'Jost', sans-serif", resize: "none", outline: "none", backgroundColor: "#FDFBF8", boxSizing: "border-box"}}
                        />
                      </div>
                      <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                        <button
                          onClick={() => handleResolveDispute(booking.id, "release")}
                          disabled={resolvingId !== null}
                          style={{fontSize: "13px", color: "#FDFBF8", backgroundColor: "#15803d", border: "none", padding: "10px 24px", borderRadius: "999px", cursor: resolvingId !== null ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: resolvingId === booking.id + "release" ? 0.6 : 1}}
                        >
                          {resolvingId === booking.id + "release" ? t("disputes.releasing") : t("disputes.releasePayment")}
                        </button>
                        <button
                          onClick={() => handleResolveDispute(booking.id, "refund")}
                          disabled={resolvingId !== null}
                          style={{fontSize: "13px", color: "#dc2626", backgroundColor: "transparent", border: "1px solid #fce8e8", padding: "10px 24px", borderRadius: "999px", cursor: resolvingId !== null ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", opacity: resolvingId === booking.id + "refund" ? 0.6 : 1}}
                        >
                          {resolvingId === booking.id + "refund" ? t("disputes.refunding") : t("disputes.refundClient")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Bookings */}
        {tab === "bookings" && (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 24px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("bookings.sectionTitle", { count: bookings.length } as any)}</p>
            {bookings.length === 0 ? (
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#DDD0C0", fontStyle: "italic"}}>{t("bookings.noBookings")}</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                {bookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((booking) => (
                  <div key={booking.id} style={{border: "1px solid #E2D5C8", borderRadius: "12px", padding: "20px", backgroundColor: "#FDFBF8"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px"}}>
                      <div>
                        <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{booking.client_name} → {booking.photographer_name}</p>
                        <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.session_type} — {booking.date} — {booking.location}</p>
                      </div>
                      <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                        <span style={statusBadge(booking.status)}>{booking.status}</span>
                        <span style={{fontSize: "13px", fontWeight: "500", color: "#1A0E06", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>{booking.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bookings.length > PAGE_SIZE && (
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", justifyContent: "center"}}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{fontSize: "12px", color: page === 0 ? "#DDD0C0" : "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>{t("pagination.prev")}</button>
                <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("pagination.page", { current: page + 1, total: Math.ceil(bookings.length / PAGE_SIZE) } as any)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= bookings.length} style={{fontSize: "12px", color: (page + 1) * PAGE_SIZE >= bookings.length ? "#DDD0C0" : "#7A5C44", background: "none", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", cursor: (page + 1) * PAGE_SIZE >= bookings.length ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif"}}>{t("pagination.next")}</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}