"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [raisingDispute, setRaisingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState("");
  const [deletionRequest, setDeletionRequest] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const [deliveredBookingIds, setDeliveredBookingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", user.id)
        .neq("status", "awaiting_payment")
        .order("created_at", { ascending: false });

      setBookings(bookings || []);

      const bookingIds = (bookings || []).map((b) => b.id);
      if (bookingIds.length > 0) {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("booking_id")
          .in("booking_id", bookingIds)
          .eq("client_id", user.id);
        setReviewedBookingIds(new Set((reviews || []).map((r: any) => r.booking_id)));
      }

      // Fetch which bookings have photo deliveries
      if (bookingIds.length > 0) {
        const { data: deliveries } = await supabase
          .from("photo_deliveries")
          .select("booking_id")
          .in("booking_id", bookingIds)
          .eq("client_id", user.id);
        setDeliveredBookingIds(new Set((deliveries || []).map((d: any) => d.booking_id)));
      }

      // Fetch deletion timestamps so we exclude messages that arrived before
      // the user deleted the conversation (WhatsApp-style hidden conversations).
      const [{ data: unreadMsgs }, { data: deletions }] = await Promise.all([
        bookingIds.length > 0
          ? supabase
              .from("messages")
              .select("booking_id, created_at")
              .in("booking_id", bookingIds)
              .eq("receiver_id", user.id)
              .eq("read", false)
          : Promise.resolve({ data: [] }),
        supabase
          .from("conversation_deletions")
          .select("booking_id, deleted_at")
          .eq("user_id", user.id),
      ]);

      const deletionMap = new Map(
        (deletions ?? []).map((d: any) => [d.booking_id, d.deleted_at])
      );
      const count = (unreadMsgs ?? []).filter((m: any) => {
        const deletedAt = deletionMap.get(m.booking_id);
        if (!deletedAt) return true;
        return new Date(m.created_at) > new Date(deletedAt);
      }).length;

      setUnreadCount(count || 0);
      const { data: delReq } = await supabase
        .from("account_deletion_requests")
        .select("id, scheduled_deletion_at")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
      setDeletionRequest(delReq || null);

      if (window.location.search.includes("booking=success")) {
        setShowPaymentSuccess(true);
        window.history.replaceState({}, "", "/dashboard");
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleRequestDeletion = async () => {
    setRequestingDeletion(true);
    setDeletionError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/request-deletion", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setDeletionError(data.error === "already_pending" ? "A deletion request already exists." : "Failed to request deletion. Please try again.");
      } else {
        setDeletionRequest({ scheduled_deletion_at: data.scheduledDate });
        setShowDeleteConfirm(false);
      }
    } catch {
      setDeletionError("Something went wrong. Please try again.");
    }
    setRequestingDeletion(false);
  };

  const handleCancelDeletion = async () => {
    setCancellingDeletion(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/cancel-deletion", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token ?? ""}` },
      });
      if (res.ok) setDeletionRequest(null);
    } catch {
      // silently fail
    }
    setCancellingDeletion(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed": return { backgroundColor: "#f0fdf4", color: "#15803d" };
      case "completed": return { backgroundColor: "#eff6ff", color: "#1d4ed8" };
      case "photos_delivered": return { backgroundColor: "#faf5ff", color: "#7c3aed" };
      case "paid_out": return { backgroundColor: "#f0fdf4", color: "#15803d" };
      case "disputed": return { backgroundColor: "#fef3c7", color: "#b45309" };
      case "pending": return { backgroundColor: "#FBF0EA", color: "#B85528" };
      case "declined": return { backgroundColor: "#fef2f2", color: "#dc2626" };
      case "cancelled": return { backgroundColor: "#fef2f2", color: "#dc2626" };
      default: return { backgroundColor: "#F5EFE4", color: "#7A5235" };
    }
  };

  const getRefundEligibility = (booking: any): string => {
    if (booking.status === "pending") return "Full refund guaranteed";
    if (booking.status !== "confirmed") return "";
    const policy = booking.cancellation_policy_snapshot || "moderate";
    if (policy === "strict") return "No refund (strict policy)";
    const hours = policy === "flexible" ? 24 : 48;
    if (!booking.date) return `Full refund if cancelled ${hours}h before session`;
    const hoursUntil = (new Date(booking.date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil > hours
      ? `Full refund available (cancel more than ${hours}h before session)`
      : `No refund — session is within ${hours}h`;
  };

  const handleRaiseDispute = async (bookingId: string) => {
    setRaisingDispute(true);
    setDisputeError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/raise-dispute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ bookingId, reason: disputeReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        setDisputeError(data.error || "Failed to raise dispute. Please try again.");
      } else {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "disputed" } : b));
        setDisputeBookingId(null);
        setDisputeReason("");
      }
    } catch {
      setDisputeError("Something went wrong. Please try again.");
    }
    setRaisingDispute(false);
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    setCancelError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) {
        setCancelError("Failed to cancel. Please try again.");
      } else {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
        setConfirmCancelId(null);
      }
    } catch {
      setCancelError("Something went wrong. Please try again.");
    }
    setCancellingId(null);
  };

  const isPastDate = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d < now;
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

      {deletionRequest && (
        <div style={{backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "14px 32px"}}>
          <div style={{maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"}}>
            <div>
              <p style={{fontSize: "13px", color: "#dc2626", margin: "0 0 2px", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                Your account is scheduled for deletion
              </p>
              <p style={{fontSize: "12px", color: "#ef4444", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                All data will be permanently deleted on {new Date(deletionRequest.scheduled_deletion_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
              </p>
            </div>
            <button
              onClick={handleCancelDeletion}
              disabled={cancellingDeletion}
              style={{backgroundColor: "#dc2626", color: "#fff", fontSize: "12px", padding: "8px 20px", border: "none", borderRadius: "999px", cursor: cancellingDeletion ? "default" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", flexShrink: 0, opacity: cancellingDeletion ? 0.7 : 1}}
            >
              {cancellingDeletion ? "Cancelling…" : "Cancel deletion"}
            </button>
          </div>
        </div>
      )}

      {showPaymentSuccess && (
        <div style={{backgroundColor: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
          <p style={{fontSize: "14px", color: "#15803d", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            ✓ Payment confirmed — your booking request has been sent to the photographer.
          </p>
          <button onClick={() => setShowPaymentSuccess(false)} style={{background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#15803d", padding: "0", lineHeight: "1"}}>×</button>
        </div>
      )}

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
                      {booking.package_snapshot && (
                        <p style={{fontSize: "11px", color: "#C3AB88", margin: "2px 0 0", fontFamily: "'Jost', sans-serif"}}>
                          {booking.package_snapshot.duration} · {booking.package_snapshot.photos_delivered} photos
                        </p>
                      )}
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
                  <div style={{marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E4D8C4", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center"}}>
                    {(booking.status === "photos_delivered" || booking.status === "paid_out") && deliveredBookingIds.has(booking.id) && (
                      <a
                        href={`/deliveries/${booking.id}`}
                        style={{fontSize: "13px", color: "#FAF7F1", backgroundColor: "#7c3aed", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", display: "inline-block"}}
                      >
                        📸 View your photos
                      </a>
                    )}
                    {booking.status === "photos_delivered" && (
                      disputeBookingId === booking.id ? (
                        <div style={{width: "100%", display: "flex", flexDirection: "column", gap: "10px"}}>
                          <p style={{fontSize: "13px", color: "#7c3aed", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                            Raise a dispute — describe the issue:
                          </p>
                          <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Describe why you're disputing (e.g. photos not delivered, wrong photos, quality issues...)"
                            rows={3}
                            style={{width: "100%", border: "1px solid #E4D8C4", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", fontFamily: "'Jost', sans-serif", resize: "none", outline: "none", backgroundColor: "#FAF7F1", boxSizing: "border-box"}}
                          />
                          <div style={{display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center"}}>
                            <button
                              onClick={() => handleRaiseDispute(booking.id)}
                              disabled={raisingDispute || !disputeReason.trim()}
                              style={{fontSize: "12px", color: "#FAF7F1", backgroundColor: "#b45309", border: "none", padding: "8px 20px", borderRadius: "999px", cursor: raisingDispute || !disputeReason.trim() ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: raisingDispute || !disputeReason.trim() ? 0.6 : 1}}
                            >
                              {raisingDispute ? "Submitting…" : "Submit dispute"}
                            </button>
                            <button
                              onClick={() => { setDisputeBookingId(null); setDisputeReason(""); setDisputeError(""); }}
                              style={{fontSize: "12px", color: "#7A5235", backgroundColor: "transparent", border: "1px solid #E4D8C4", padding: "8px 16px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                            >
                              Cancel
                            </button>
                            {disputeError && <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{disputeError}</p>}
                          </div>
                        </div>
                      ) : (
                        <div style={{display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap"}}>
                          <span style={{fontSize: "12px", color: "#7c3aed", fontFamily: "'Jost', sans-serif"}}>
                            📸 Photos delivered — dispute window closes {booking.payout_due_at ? new Date(booking.payout_due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "soon"}
                          </span>
                          <button
                            onClick={() => { setDisputeBookingId(booking.id); setDisputeError(""); }}
                            style={{fontSize: "12px", color: "#b45309", backgroundColor: "transparent", border: "1px solid #fde68a", padding: "6px 16px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                          >
                            Raise a dispute
                          </button>
                        </div>
                      )
                    )}
                    {booking.status === "paid_out" && (
                      <span style={{fontSize: "12px", color: "#15803d", fontFamily: "'Jost', sans-serif"}}>✓ Session complete</span>
                    )}
                    {booking.status === "disputed" && (
                      <span style={{fontSize: "12px", color: "#b45309", fontFamily: "'Jost', sans-serif"}}>⚠ Dispute under admin review — we'll be in touch</span>
                    )}
                    <a href={`/messages/${booking.id}`} style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", border: "1px solid #E4D8C4", padding: "8px 20px", borderRadius: "999px", display: "inline-block", fontFamily: "'Jost', sans-serif"}}>
                      💬 Message photographer
                    </a>
                    {booking.status === "confirmed" &&
                     isPastDate(booking.date) &&
                     !reviewedBookingIds.has(booking.id) && (
                      <a href={`/review/${booking.id}`} style={{fontSize: "13px", color: "#B85528", textDecoration: "none", border: "1px solid #B85528", padding: "8px 20px", borderRadius: "999px", display: "inline-block", fontFamily: "'Jost', sans-serif"}}>
                        Leave a review ⭐
                      </a>
                    )}
                    {(booking.status === "pending" || (booking.status === "confirmed" && !isPastDate(booking.date))) && (
                      confirmCancelId === booking.id ? (
                        <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"}}>
                          <p style={{fontSize: "12px", color: "#7A5235", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                            {getRefundEligibility(booking)} — confirm cancel?
                          </p>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancellingId === booking.id}
                            style={{fontSize: "12px", color: "#FAF7F1", backgroundColor: "#dc2626", border: "none", padding: "7px 16px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif", opacity: cancellingId === booking.id ? 0.6 : 1}}
                          >
                            {cancellingId === booking.id ? "Cancelling…" : "Yes, cancel"}
                          </button>
                          <button
                            onClick={() => { setConfirmCancelId(null); setCancelError(""); }}
                            style={{fontSize: "12px", color: "#7A5235", backgroundColor: "transparent", border: "1px solid #E4D8C4", padding: "7px 16px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                          >
                            Keep booking
                          </button>
                          {cancelError && <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{cancelError}</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => { setConfirmCancelId(booking.id); setCancelError(""); }}
                          style={{fontSize: "13px", color: "#9E7250", backgroundColor: "transparent", border: "1px solid #E4D8C4", padding: "8px 20px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                        >
                          Cancel booking
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account settings */}
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "32px", border: "1px solid #E4D8C4", marginTop: "32px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>ACCOUNT SETTINGS</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1C1009", margin: "0 0 16px", letterSpacing: "-0.02em"}}>Delete my account</h2>

          {deletionRequest ? (
            <div>
              <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 16px", fontFamily: "'Jost', sans-serif", lineHeight: "1.6"}}>
                Your account is scheduled for permanent deletion on <strong>{new Date(deletionRequest.scheduled_deletion_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>. You can cancel this request before that date.
              </p>
              <button
                onClick={handleCancelDeletion}
                disabled={cancellingDeletion}
                style={{backgroundColor: "transparent", color: "#15803d", fontSize: "13px", padding: "10px 24px", border: "1px solid #bbf7d0", borderRadius: "999px", cursor: cancellingDeletion ? "default" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: cancellingDeletion ? 0.7 : 1}}
              >
                {cancellingDeletion ? "Cancelling…" : "Cancel deletion request"}
              </button>
            </div>
          ) : showDeleteConfirm ? (
            <div>
              <div style={{backgroundColor: "#fef2f2", borderRadius: "8px", padding: "16px", border: "1px solid #fecaca", marginBottom: "16px"}}>
                <p style={{fontSize: "13px", fontWeight: "500", color: "#dc2626", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>This cannot be undone. Before your account is permanently deleted:</p>
                <ul style={{fontSize: "13px", color: "#7A5235", margin: "0", paddingLeft: "18px", lineHeight: "2", fontFamily: "'Jost', sans-serif"}}>
                  <li>All pending and confirmed bookings will be cancelled and fully refunded</li>
                  <li>You will have 30 days to change your mind from your dashboard</li>
                  <li>After 30 days, your personal data is anonymised and unrecoverable</li>
                </ul>
              </div>
              {deletionError && <p style={{fontSize: "12px", color: "#dc2626", margin: "0 0 12px", fontFamily: "'Jost', sans-serif"}}>{deletionError}</p>}
              <div style={{display: "flex", gap: "12px", flexWrap: "wrap"}}>
                <button
                  onClick={handleRequestDeletion}
                  disabled={requestingDeletion}
                  style={{backgroundColor: "#dc2626", color: "#fff", fontSize: "13px", padding: "10px 24px", border: "none", borderRadius: "999px", cursor: requestingDeletion ? "default" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: requestingDeletion ? 0.7 : 1}}
                >
                  {requestingDeletion ? "Requesting…" : "Yes, delete my account"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletionError(""); }}
                  style={{backgroundColor: "transparent", color: "#7A5235", fontSize: "13px", padding: "10px 24px", border: "1px solid #E4D8C4", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                >
                  Keep my account
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 16px", fontFamily: "'Jost', sans-serif", lineHeight: "1.6"}}>
                Permanently delete your account and all associated data. Active bookings will be cancelled and fully refunded. You will have a 30-day window to change your mind.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{backgroundColor: "transparent", color: "#dc2626", fontSize: "13px", padding: "10px 24px", border: "1px solid #fecaca", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}
              >
                Delete my account
              </button>
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