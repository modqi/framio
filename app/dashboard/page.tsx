"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import { CameraIcon, MessageIcon } from "../components/Icons";
import GlobeModal from "../components/GlobeModal";
import { useCurrency } from "../../lib/currency-context";
import { useTranslations } from "next-intl";

export default function Dashboard() {
  const { convertPrice } = useCurrency();
  const t = useTranslations("ClientDashboard");
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
  const [phonePromptInput, setPhonePromptInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

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

  const handleSavePhone = async () => {
    if (!phonePromptInput.trim()) return;
    setSavingPhone(true);
    await supabase.auth.updateUser({ data: { phone_number: phonePromptInput.trim() } });
    setSavingPhone(false);
    setPhoneSaved(true);
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
        setDeletionError(data.error === "already_pending" ? t("errors.alreadyPending") : t("errors.deletionFailed"));
      } else {
        setDeletionRequest({ scheduled_deletion_at: data.scheduledDate });
        setShowDeleteConfirm(false);
      }
    } catch {
      setDeletionError(t("errors.genericError"));
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
      case "pending": return { backgroundColor: "#FBF0EA", color: "#C8622A" };
      case "declined": return { backgroundColor: "#fef2f2", color: "#dc2626" };
      case "cancelled": return { backgroundColor: "#fef2f2", color: "#dc2626" };
      default: return { backgroundColor: "#F5EFE4", color: "#7A5C44" };
    }
  };

  const getRefundEligibility = (booking: any): string => {
    if (booking.status === "pending") return t("refund.fullGuaranteed");
    if (booking.status !== "confirmed") return "";
    const policy = booking.cancellation_policy_snapshot || "moderate";
    if (policy === "strict") return t("refund.noRefundStrict");
    const hours = policy === "flexible" ? 24 : 48;
    if (!booking.date) return t("refund.fullRefundIf", { hours });
    const hoursUntil = (new Date(booking.date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil > hours
      ? t("refund.fullRefundAvailable", { hours })
      : t("refund.noRefundWithin", { hours });
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
        setDisputeError(data.error || t("errors.genericError"));
      } else {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "disputed" } : b));
        setDisputeBookingId(null);
        setDisputeReason("");
      }
    } catch {
      setDisputeError(t("errors.genericError"));
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
        setCancelError(t("errors.cancelFailed"));
      } else {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
        setConfirmCancelId(null);
      }
    } catch {
      setCancelError(t("errors.genericError"));
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
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>{t("loading")}</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <GlobeModal />
          <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
            {t("nav.hello", { name: user?.user_metadata?.name?.split(" ")[0] || "there" })}
          </span>
          <a href="/messages" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", border: "1px solid #E2D5C8", padding: "6px 16px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Jost', sans-serif"}}>
            <MessageIcon size={16} color="#7A5C44"/> {t("nav.messages")}
            {unreadCount > 0 && (
              <span style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "999px"}}>
                {unreadCount}
              </span>
            )}
          </a>
          <button onClick={handleSignOut} style={{fontSize: "12px", color: "#7A5C44", border: "1px solid #E2D5C8", padding: "6px 16px", borderRadius: "999px", backgroundColor: "transparent", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}>
            {t("nav.signOut")}
          </button>
        </div>
      </nav>

      {deletionRequest && (
        <div style={{backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "14px 32px"}}>
          <div style={{maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"}}>
            <div>
              <p style={{fontSize: "13px", color: "#dc2626", margin: "0 0 2px", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                {t("deletion.bannerTitle")}
              </p>
              <p style={{fontSize: "12px", color: "#ef4444", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                {t("deletion.bannerDesc", { date: new Date(deletionRequest.scheduled_deletion_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) })}
              </p>
            </div>
            <button
              onClick={handleCancelDeletion}
              disabled={cancellingDeletion}
              style={{backgroundColor: "#dc2626", color: "#fff", fontSize: "12px", padding: "8px 20px", border: "none", borderRadius: "999px", cursor: cancellingDeletion ? "default" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", flexShrink: 0, opacity: cancellingDeletion ? 0.7 : 1}}
            >
              {cancellingDeletion ? t("deletion.cancelling") : t("deletion.cancelDeletion")}
            </button>
          </div>
        </div>
      )}

      {showPaymentSuccess && (
        <div style={{backgroundColor: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
          <p style={{fontSize: "14px", color: "#15803d", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            {t("paymentSuccess")}
          </p>
          <button onClick={() => setShowPaymentSuccess(false)} style={{background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#15803d", padding: "0", lineHeight: "1"}}>×</button>
        </div>
      )}

      <div style={{maxWidth: "1000px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Welcome */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("welcome.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {t("welcome.heading")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t("welcome.description")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: t("stats.totalBookings"), value: bookings.length, desc: t("stats.allTime") },
            { label: t("stats.confirmed"), value: bookings.filter(b => b.status === "confirmed").length, desc: t("stats.upcomingSessions") },
            { label: t("stats.pending"), value: bookings.filter(b => b.status === "pending").length, desc: t("stats.awaitingResponse") },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "24px", border: "1px solid #E2D5C8"}}>
              <p style={{fontSize: "12px", color: "#7A5C44", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{stat.label}</p>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1A0E06", margin: "0 0 4px", letterSpacing: "-0.02em"}}>{stat.value}</p>
              <p style={{fontSize: "12px", color: "#C8622A", margin: "0", fontFamily: "'Jost', sans-serif"}}>{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", marginBottom: "32px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("quickActions.label")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/photographers" style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #E2D5C8", borderRadius: "12px", textDecoration: "none", backgroundColor: "#FDFBF8"}}>
              <div style={{width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#C8622A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}><CameraIcon size={22} color="#FDFBF8"/></div>
              <div>
                <p style={{fontSize: "14px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{t("quickActions.findPhotographer")}</p>
                <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("quickActions.findPhotographerDesc")}</p>
              </div>
            </a>
            <a href="/messages" style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: unreadCount > 0 ? "1px solid #C8622A" : "1px solid #E2D5C8", borderRadius: "12px", textDecoration: "none", backgroundColor: "#FDFBF8"}}>
              <div style={{width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#C8622A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative"}}>
                <MessageIcon size={22} color="#FDFBF8"/>
                {unreadCount > 0 && (
                  <span style={{position: "absolute", top: "-4px", right: "-4px", backgroundColor: "#dc2626", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 5px", borderRadius: "999px"}}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <p style={{fontSize: "14px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{t("quickActions.messages")}</p>
                <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : t("quickActions.chatWith")}</p>
              </div>
            </a>
          </div>
        </div>

        {/* Phone number prompt — shown once client has at least one booking and no phone saved */}
        {bookings.length > 0 && !user?.user_metadata?.phone_number && !phoneSaved && (
          <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "24px 28px", border: "1px solid #E2D5C8", marginBottom: "32px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap"}}>
            <div style={{flex: 1, minWidth: "200px"}}>
              <p style={{fontSize: "13px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("phone.title")}</p>
              <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{t("phone.description")}</p>
            </div>
            <div style={{display: "flex", gap: "8px", flexShrink: 0, alignItems: "center"}}>
              <input
                type="tel"
                value={phonePromptInput}
                onChange={(e) => setPhonePromptInput(e.target.value)}
                placeholder="+47 900 00 000"
                style={{border: "1px solid #E2D5C8", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", fontFamily: "'Jost', sans-serif", width: "180px"}}
              />
              <button
                onClick={handleSavePhone}
                disabled={savingPhone || !phonePromptInput.trim()}
                style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "12px", padding: "10px 20px", border: "none", borderRadius: "999px", cursor: savingPhone || !phonePromptInput.trim() ? "default" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: savingPhone || !phonePromptInput.trim() ? 0.6 : 1, whiteSpace: "nowrap"}}
              >
                {savingPhone ? t("phone.saving") : t("phone.save")}
              </button>
              <button
                onClick={() => setPhoneSaved(true)}
                style={{background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#7A5C44", padding: "4px", lineHeight: "1", flexShrink: 0}}
                title="Dismiss"
              >×</button>
            </div>
          </div>
        )}

        {/* Bookings */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("bookings.label")}</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "26px", fontWeight: "400", color: "#1A0E06", margin: "0 0 24px", letterSpacing: "-0.02em"}}>
            {t("bookings.heading")}
          </h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div style={{marginBottom: "16px"}}><CameraIcon size={56} color="#C8622A"/></div>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", color: "#1A0E06", margin: "0 0 8px"}}>{t("bookings.noneHeading")}</p>
              <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 24px", fontFamily: "'Jost', sans-serif"}}>{t("bookings.noneDescription")}</p>
              <a href="/photographers" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                {t("bookings.noneCta")}
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} style={{border: "1px solid #E2D5C8", borderRadius: "12px", padding: "20px", backgroundColor: "#FDFBF8"}}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <a href={`/photographers/${booking.photographer_id}`} style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px", textDecoration: "none", display: "block"}}>
                        {booking.photographer_name} →
                      </a>
                      <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.session_type}</p>
                      {booking.package_snapshot && (
                        <p style={{fontSize: "11px", color: "#DDD0C0", margin: "2px 0 0", fontFamily: "'Jost', sans-serif"}}>
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
                      <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("bookings.date")}</p>
                      <p style={{fontSize: "13px", color: "#1A0E06", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.date || t("bookings.notSet")}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("bookings.location")}</p>
                      <p style={{fontSize: "13px", color: "#1A0E06", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.location || t("bookings.notSet")}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("bookings.price")}</p>
                      <p style={{fontSize: "13px", color: "#1A0E06", margin: "0", fontFamily: "'Jost', sans-serif"}}>{convertPrice(booking.price)}</p>
                    </div>
                    <div>
                      <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("bookings.bookedOn")}</p>
                      <p style={{fontSize: "13px", color: "#1A0E06", margin: "0", fontFamily: "'Jost', sans-serif"}}>{new Date(booking.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {booking.message && (
                    <div style={{marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E2D5C8"}}>
                      <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("bookings.yourMessage")}</p>
                      <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>"{booking.message}"</p>
                    </div>
                  )}
                  <div style={{marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E2D5C8", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center"}}>
                    {(booking.status === "photos_delivered" || booking.status === "paid_out") && deliveredBookingIds.has(booking.id) && (
                      <a
                        href={`/deliveries/${booking.id}`}
                        style={{fontSize: "13px", color: "#FDFBF8", backgroundColor: "#7c3aed", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", display: "inline-block"}}
                      >
                        {t("bookings.viewPhotos")}
                      </a>
                    )}
                    {booking.status === "photos_delivered" && (
                      disputeBookingId === booking.id ? (
                        <div style={{width: "100%", display: "flex", flexDirection: "column", gap: "10px"}}>
                          <p style={{fontSize: "13px", color: "#7c3aed", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                            {t("bookings.disputeHeading")}
                          </p>
                          <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder={t("bookings.disputePlaceholder")}
                            rows={3}
                            style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", fontFamily: "'Jost', sans-serif", resize: "none", outline: "none", backgroundColor: "#FDFBF8", boxSizing: "border-box"}}
                          />
                          <div style={{display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center"}}>
                            <button
                              onClick={() => handleRaiseDispute(booking.id)}
                              disabled={raisingDispute || !disputeReason.trim()}
                              style={{fontSize: "12px", color: "#FDFBF8", backgroundColor: "#b45309", border: "none", padding: "8px 20px", borderRadius: "999px", cursor: raisingDispute || !disputeReason.trim() ? "not-allowed" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: raisingDispute || !disputeReason.trim() ? 0.6 : 1}}
                            >
                              {raisingDispute ? t("bookings.submittingDispute") : t("bookings.submitDispute")}
                            </button>
                            <button
                              onClick={() => { setDisputeBookingId(null); setDisputeReason(""); setDisputeError(""); }}
                              style={{fontSize: "12px", color: "#7A5C44", backgroundColor: "transparent", border: "1px solid #E2D5C8", padding: "8px 16px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                            >
                              {t("bookings.cancel")}
                            </button>
                            {disputeError && <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{disputeError}</p>}
                          </div>
                        </div>
                      ) : (
                        <div style={{display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap"}}>
                          <span style={{fontSize: "12px", color: "#7c3aed", fontFamily: "'Jost', sans-serif"}}>
                            {t("bookings.photosDeliveredWindow", { date: booking.payout_due_at ? new Date(booking.payout_due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "soon" })}
                          </span>
                          <button
                            onClick={() => { setDisputeBookingId(booking.id); setDisputeError(""); }}
                            style={{fontSize: "12px", color: "#b45309", backgroundColor: "transparent", border: "1px solid #fde68a", padding: "6px 16px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                          >
                            {t("bookings.raiseDispute")}
                          </button>
                        </div>
                      )
                    )}
                    {booking.status === "paid_out" && (
                      <span style={{fontSize: "12px", color: "#15803d", fontFamily: "'Jost', sans-serif"}}>{t("bookings.sessionComplete")}</span>
                    )}
                    {booking.status === "disputed" && (
                      <span style={{fontSize: "12px", color: "#b45309", fontFamily: "'Jost', sans-serif"}}>{t("bookings.disputeUnderReview")}</span>
                    )}
                    <a href={`/messages/${booking.id}`} style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", border: "1px solid #E2D5C8", padding: "8px 20px", borderRadius: "999px", display: "inline-block", fontFamily: "'Jost', sans-serif"}}>
                      {t("bookings.messagePhotographer")}
                    </a>
                    {booking.status === "confirmed" &&
                     isPastDate(booking.date) &&
                     !reviewedBookingIds.has(booking.id) && (
                      <a href={`/review/${booking.id}`} style={{fontSize: "13px", color: "#C8622A", textDecoration: "none", border: "1px solid #C8622A", padding: "8px 20px", borderRadius: "999px", display: "inline-block", fontFamily: "'Jost', sans-serif"}}>
                        {t("bookings.leaveReview")}
                      </a>
                    )}
                    {(booking.status === "pending" || (booking.status === "confirmed" && !isPastDate(booking.date))) && (
                      confirmCancelId === booking.id ? (
                        <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"}}>
                          <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                            {getRefundEligibility(booking)} — {t("bookings.confirmCancelSuffix")}
                          </p>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancellingId === booking.id}
                            style={{fontSize: "12px", color: "#FDFBF8", backgroundColor: "#dc2626", border: "none", padding: "7px 16px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif", opacity: cancellingId === booking.id ? 0.6 : 1}}
                          >
                            {cancellingId === booking.id ? t("bookings.cancelling") : t("bookings.yesCancel")}
                          </button>
                          <button
                            onClick={() => { setConfirmCancelId(null); setCancelError(""); }}
                            style={{fontSize: "12px", color: "#7A5C44", backgroundColor: "transparent", border: "1px solid #E2D5C8", padding: "7px 16px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                          >
                            {t("bookings.keepBooking")}
                          </button>
                          {cancelError && <p style={{fontSize: "12px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{cancelError}</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => { setConfirmCancelId(booking.id); setCancelError(""); }}
                          style={{fontSize: "13px", color: "#7A5C44", backgroundColor: "transparent", border: "1px solid #E2D5C8", padding: "8px 20px", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                        >
                          {t("bookings.cancelBooking")}
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
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", marginTop: "32px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("account.label")}</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1A0E06", margin: "0 0 16px", letterSpacing: "-0.02em"}}>{t("account.heading")}</h2>

          {deletionRequest ? (
            <div>
              <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 16px", fontFamily: "'Jost', sans-serif", lineHeight: "1.6"}}>
                {t("account.scheduledDesc", { date: new Date(deletionRequest.scheduled_deletion_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) })}
              </p>
              <button
                onClick={handleCancelDeletion}
                disabled={cancellingDeletion}
                style={{backgroundColor: "transparent", color: "#15803d", fontSize: "13px", padding: "10px 24px", border: "1px solid #bbf7d0", borderRadius: "999px", cursor: cancellingDeletion ? "default" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: cancellingDeletion ? 0.7 : 1}}
              >
                {cancellingDeletion ? t("account.cancelling") : t("account.cancelRequest")}
              </button>
            </div>
          ) : showDeleteConfirm ? (
            <div>
              <div style={{backgroundColor: "#fef2f2", borderRadius: "8px", padding: "16px", border: "1px solid #fecaca", marginBottom: "16px"}}>
                <p style={{fontSize: "13px", fontWeight: "500", color: "#dc2626", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{t("account.warningTitle")}</p>
                <ul style={{fontSize: "13px", color: "#7A5C44", margin: "0", paddingLeft: "18px", lineHeight: "2", fontFamily: "'Jost', sans-serif"}}>
                  <li>{t("account.warning1")}</li>
                  <li>{t("account.warning2")}</li>
                  <li>{t("account.warning3")}</li>
                </ul>
              </div>
              {deletionError && <p style={{fontSize: "12px", color: "#dc2626", margin: "0 0 12px", fontFamily: "'Jost', sans-serif"}}>{deletionError}</p>}
              <div style={{display: "flex", gap: "12px", flexWrap: "wrap"}}>
                <button
                  onClick={handleRequestDeletion}
                  disabled={requestingDeletion}
                  style={{backgroundColor: "#dc2626", color: "#fff", fontSize: "13px", padding: "10px 24px", border: "none", borderRadius: "999px", cursor: requestingDeletion ? "default" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: requestingDeletion ? 0.7 : 1}}
                >
                  {requestingDeletion ? t("account.requesting") : t("account.yesDelete")}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletionError(""); }}
                  style={{backgroundColor: "transparent", color: "#7A5C44", fontSize: "13px", padding: "10px 24px", border: "1px solid #E2D5C8", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                >
                  {t("account.keepAccount")}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 16px", fontFamily: "'Jost', sans-serif", lineHeight: "1.6"}}>
                {t("account.description")}
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{backgroundColor: "transparent", color: "#dc2626", fontSize: "13px", padding: "10px 24px", border: "1px solid #fecaca", borderRadius: "999px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}
              >
                {t("account.deleteButton")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}