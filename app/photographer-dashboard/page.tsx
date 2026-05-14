"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import { CameraIcon, CalendarIcon, MessageIcon, ProfileIcon, PortfolioIcon, PackageIcon, EmptyInboxIcon, CheckIcon } from "../components/Icons";
import GlobeModal from "../components/GlobeModal";
import { useCurrency } from "../../lib/currency-context";
import { useTranslations } from "next-intl";

const parsePrice = (price: unknown): number => {
  const n = parseFloat(String(price ?? "").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

const fmtMoney = (amount: number, currency = "usd"): string => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
};

export default function PhotographerDashboard() {
  const { convertPrice } = useCurrency();
  const t = useTranslations("PhotographerDashboard");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [completion, setCompletion] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [stripeOnboarded, setStripeOnboarded] = useState<boolean | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectIncomplete, setConnectIncomplete] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "earnings">("overview");
  const [earningsData, setEarningsData] = useState<any>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsError, setEarningsError] = useState("");
  const [deletionRequest, setDeletionRequest] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const [tasksDone, setTasksDone] = useState<boolean[]>([]);
  const TASK_KEYS = [
    "completion.addPhoto",
    "completion.writeBio",
    "completion.addPortfolio",
    "completion.addPackages",
    "completion.addLocation",
  ] as const;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectStatus = params.get("connect");
    if (connectStatus === "incomplete") {
      setConnectIncomplete(true);
    } else if (connectStatus === "error") {
      const msg = params.get("msg");
      setConnectError(msg ? `Setup error: ${msg}` : "Setup failed — please try again.");
    }
    if (connectStatus) {
      window.history.replaceState({}, "", "/photographer-dashboard");
    }
  }, []);

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

        const { data: photographerRow } = await supabase
          .from("photographers")
          .select("stripe_onboarding_completed, profile_photo, photographer_packages(id)")
          .eq("user_id", user.id)
          .single();
        setStripeOnboarded(photographerRow?.stripe_onboarding_completed ?? false);

        const hasPackages = (photographerRow?.photographer_packages?.length ?? 0) > 0;
        const doneBooleans = [
          !!photographerRow?.profile_photo,
          !!meta?.bio,
          (photoCount || 0) > 0,
          hasPackages,
          !!meta?.location,
        ];
        setTasksDone(doneBooleans);
        const done = doneBooleans.filter(Boolean).length;
        setCompletion(Math.round((done / doneBooleans.length) * 100));

        const { data: delReq } = await supabase
          .from("account_deletion_requests")
          .select("id, scheduled_deletion_at")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .maybeSingle();
        setDeletionRequest(delReq || null);

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

  const handleCompleteStripeSetup = async () => {
    setConnectLoading(true);
    setConnectError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe-connect/onboarding-link", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setConnectError(data.error ?? "Could not generate onboarding link. Please try again.");
        setConnectLoading(false);
      }
    } catch {
      setConnectError("Something went wrong. Please try again.");
      setConnectLoading(false);
    }
  };

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

  const handleBookingStatus = async (id: string, status: string) => {
    setProcessingId(id);
    setActionError("");
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      setActionError(t("errors.updateFailed"));
      setProcessingId(null);
      return;
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setProcessingId(null);

    if (status === "confirmed") {
      const booking = bookings.find(b => b.id === id);
      if (booking?.client_email) {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "booking_confirmed",
            clientEmail: booking.client_email,
            clientName: booking.client_name,
            photographerName: booking.photographer_name,
            sessionType: booking.session_type,
            date: booking.date,
            location: booking.location,
            price: booking.price,
          }),
        });
      }
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "confirmed") return { backgroundColor: "#f0fdf4", color: "#15803d" };
    if (status === "completed") return { backgroundColor: "#eff6ff", color: "#1d4ed8" };
    if (status === "photos_delivered") return { backgroundColor: "#faf5ff", color: "#7c3aed" };
    if (status === "paid_out") return { backgroundColor: "#f0fdf4", color: "#15803d" };
    if (status === "disputed") return { backgroundColor: "#fef3c7", color: "#b45309" };
    if (status === "declined") return { backgroundColor: "#fef2f2", color: "#dc2626" };
    if (status === "cancelled") return { backgroundColor: "#fef2f2", color: "#dc2626" };
    return { backgroundColor: "#FBF0EA", color: "#C8622A" };
  };

  const loadEarnings = async () => {
    if (earningsData !== null || earningsLoading) return;
    setEarningsLoading(true);
    setEarningsError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/photographer-earnings", {
        headers: { "Authorization": `Bearer ${session?.access_token ?? ""}` },
      });
      if (res.ok) {
        setEarningsData(await res.json());
      } else {
        setEarningsError(t("errors.stripeError"));
        setEarningsData({});
      }
    } catch {
      setEarningsError(t("errors.stripeGenericError"));
      setEarningsData({});
    }
    setEarningsLoading(false);
  };


  const handleCancelBooking = async (id: string) => {
    setCancellingId(id);
    setCancelError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ bookingId: id }),
      });
      if (!res.ok) {
        setCancelError(t("errors.cancelFailed"));
      } else {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
        setConfirmCancelId(null);
      }
    } catch {
      setCancelError(t("errors.genericError"));
    }
    setCancellingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
        <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>{t("loading")}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <GlobeModal />
          <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{user?.user_metadata?.name}</span>
          <a href="/messages" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", border: "1px solid #E2D5C8", padding: "6px 16px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Jost', sans-serif"}}>
            <MessageIcon size={16} color="#7A5C44" /> {t("nav.messages")}
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

      {/* Stripe onboarding banner — shown until payout setup is complete */}
      {stripeOnboarded === false && (
        <div style={{backgroundColor: "#1A0E06", padding: "16px 32px"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"}}>
            <div>
              <p style={{fontSize: "13px", color: "#FDFBF8", margin: "0 0 2px", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("stripe.notVisible")}</p>
              <p style={{fontSize: "12px", color: "rgba(253,251,248,0.5)", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                {connectIncomplete ? t("stripe.incompleteDesc") : t("stripe.connectDesc")}
              </p>
            </div>
            <button
              onClick={handleCompleteStripeSetup}
              disabled={connectLoading}
              style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "12px", padding: "10px 24px", border: "none", borderRadius: "999px", cursor: connectLoading ? "default" : "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", flexShrink: 0, opacity: connectLoading ? 0.7 : 1}}
            >
              {connectLoading ? t("stripe.loading") : connectIncomplete ? t("stripe.resume") : t("stripe.connect")}
            </button>
          </div>
          {connectError && (
            <p style={{fontSize: "12px", color: "#f87171", margin: "10px 0 0", fontFamily: "'Jost', sans-serif"}}>
              {connectError}
            </p>
          )}
        </div>
      )}

      {deletionRequest && (
        <div style={{backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "14px 32px"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"}}>
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

      <div style={{maxWidth: "1000px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Welcome */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("welcome.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {t("welcome.heading")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{t("welcome.description")}</p>
        </div>

        {/* Tab navigation */}
        <div style={{display: "flex", borderBottom: "1px solid #E2D5C8", marginBottom: "32px"}}>
          {([
            { id: "overview", label: t("tabs.overview") },
            { id: "earnings", label: t("tabs.earnings") },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === "earnings") loadEarnings(); }}
              style={{padding: "12px 24px", fontSize: "13px", fontFamily: "'Jost', sans-serif", fontWeight: "500", border: "none", cursor: "pointer", backgroundColor: "transparent", color: activeTab === tab.id ? "#C8622A" : "#7A5C44", borderBottom: `2px solid ${activeTab === tab.id ? "#C8622A" : "transparent"}`, marginBottom: "-1px", transition: "color 0.15s"}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        <div style={{display: activeTab === "overview" ? "block" : "none"}}>

        {/* Profile card */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "24px", border: "1px solid #E2D5C8", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px"}}>
          <div style={{width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#F5EFE4", border: "1px solid #E2D5C8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
            <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: "500", color: "#C8622A"}}>{user?.user_metadata?.name?.[0] || "?"}</span>
          </div>
          <div style={{flex: 1}}>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{user?.user_metadata?.name || "Your name"}</p>
            <p style={{fontSize: "12px", color: "#7A5C44", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{user?.user_metadata?.location || t("profile.noLocation")}</p>
            <p style={{fontSize: "12px", color: "#C8622A", margin: "0", fontFamily: "'Jost', sans-serif"}}>{user?.user_metadata?.specialty || t("profile.noSpecialty")}</p>
          </div>
          <a href="/photographer-dashboard/edit-profile" style={{fontSize: "12px", color: "#1A0E06", border: "1px solid #E2D5C8", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", backgroundColor: "#FDFBF8", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>
            {t("profile.editProfile")}
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t("stats.totalBookings"), value: bookings.length, desc: t("stats.allTime") },
            { label: t("stats.pending"), value: bookings.filter(b => b.status === "pending").length, desc: t("stats.awaitingResponse") },
            { label: t("stats.confirmed"), value: bookings.filter(b => b.status === "confirmed").length, desc: t("stats.confirmedSessions") },
            { label: t("stats.unreadMessages"), value: unreadCount, desc: t("stats.newMessages") },
          ].map((stat) => (
            <div key={stat.label} style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "20px", border: "1px solid #E2D5C8"}}>
              <p style={{fontSize: "11px", color: "#7A5C44", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{stat.label}</p>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 4px", letterSpacing: "-0.02em"}}>{stat.value}</p>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0", fontFamily: "'Jost', sans-serif"}}>{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Profile completion */}
        <div style={{backgroundColor: "#1A0E06", borderRadius: "12px", padding: "32px", marginBottom: "32px"}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{fontSize: "11px", color: "#C1622F", margin: "0 0 6px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("completion.label")}</p>
              <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#FDFBF8", margin: "0"}}>{t("completion.heading")}</h2>
              <p style={{fontSize: "13px", color: "rgba(253,251,248,0.4)", margin: "4px 0 0", fontFamily: "'Jost', sans-serif"}}>{t("completion.description")}</p>
            </div>
            <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "44px", fontWeight: "400", color: "#C1622F", letterSpacing: "-0.02em"}}>{completion}%</span>
          </div>
          <div style={{width: "100%", backgroundColor: "rgba(253,251,248,0.1)", borderRadius: "4px", height: "4px", marginBottom: "24px"}}>
            <div style={{width: `${completion}%`, backgroundColor: "#C1622F", height: "4px", borderRadius: "4px", transition: "width 0.5s"}}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TASK_KEYS.map((key, i) => (
              <div key={key} className="flex items-center gap-3">
                <div style={{width: "20px", height: "20px", borderRadius: "50%", backgroundColor: tasksDone[i] ? "#C1622F" : "transparent", border: tasksDone[i] ? "none" : "1px solid rgba(253,251,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                  {tasksDone[i] && <CheckIcon size={11} color="#FDFBF8"/>}
                </div>
                <span style={{fontSize: "13px", color: tasksDone[i] ? "rgba(253,251,248,0.4)" : "#FDFBF8", textDecoration: tasksDone[i] ? "line-through" : "none", fontFamily: "'Jost', sans-serif"}}>{t(key as any)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", marginBottom: "32px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("quickActions.label")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: <ProfileIcon size={22} color="#FDFBF8"/>, title: t("quickActions.editProfile"), desc: t("quickActions.editProfileDesc"), href: "/photographer-dashboard/edit-profile" },
              { icon: <PortfolioIcon size={22} color="#FDFBF8"/>, title: t("quickActions.portfolio"), desc: t("quickActions.portfolioDesc"), href: "/photographer-dashboard/portfolio" },
              { icon: <CalendarIcon size={22} color="#FDFBF8"/>, title: t("quickActions.availability"), desc: t("quickActions.availabilityDesc"), href: "/photographer-dashboard/availability" },
              { icon: <PackageIcon size={22} color="#FDFBF8"/>, title: t("quickActions.packages"), desc: t("quickActions.packagesDesc"), href: "/photographer-dashboard/packages" },
            ].map((action) => (
              <a key={action.title} href={action.href} style={{display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #E2D5C8", borderRadius: "12px", textDecoration: "none", backgroundColor: "#FDFBF8"}}>
                <div style={{width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#C8622A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                  {action.icon}
                </div>
                <div>
                  <p style={{fontSize: "14px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px", fontFamily: "'Jost', sans-serif"}}>{action.title}</p>
                  <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{action.desc}</p>
                </div>
              </a>
            ))}
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

        {/* Booking requests */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("bookings.label")}</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "26px", fontWeight: "400", color: "#1A0E06", margin: "0 0 24px", letterSpacing: "-0.02em"}}>{t("bookings.heading")}</h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div style={{marginBottom: "16px"}}><EmptyInboxIcon size={56} color="#C8622A"/></div>
              <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", color: "#1A0E06", margin: "0 0 8px"}}>{t("bookings.noneHeading")}</p>
              <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 24px", fontFamily: "'Jost', sans-serif"}}>{t("bookings.noneDescription")}</p>
              <a href="/photographer-dashboard/edit-profile" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                {t("bookings.noneCta")}
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} style={{border: "1px solid #E2D5C8", borderRadius: "12px", padding: "20px", backgroundColor: "#FDFBF8"}}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{booking.client_name}</p>
                      <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.client_email}</p>
                    </div>
                    <span style={{...getStatusStyle(booking.status), fontSize: "12px", padding: "4px 12px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}>
                      {t(`bookings.statuses.${booking.status}` as any)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { label: t("bookings.session"), value: booking.session_type },
                      { label: t("bookings.date"), value: booking.date || t("bookings.notSet") },
                      { label: t("bookings.location"), value: booking.location || t("bookings.notSet") },
                      { label: t("bookings.price"), value: convertPrice(booking.price) },
                    ].map((item) => (
                      <div key={item.label}>
                        <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{item.label}</p>
                        <p style={{fontSize: "13px", color: "#1A0E06", margin: "0", fontFamily: "'Jost', sans-serif"}}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {booking.message && (
                    <div style={{backgroundColor: "#FDFBF8", border: "1px solid #E2D5C8", borderRadius: "8px", padding: "12px", marginBottom: "16px"}}>
                      <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("bookings.messageFromClient")}</p>
                      <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>"{booking.message}"</p>
                    </div>
                  )}
                  {actionError && (
                    <div style={{marginBottom: "12px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                      <p style={{fontSize: "12px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{actionError}</p>
                    </div>
                  )}
                  <div style={{display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center"}}>
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleBookingStatus(booking.id, "confirmed")}
                          disabled={processingId === booking.id}
                          style={{flex: 1, backgroundColor: processingId === booking.id ? "#7A5C44" : "#1A0E06", color: "#FDFBF8", padding: "10px", borderRadius: "999px", border: "none", cursor: processingId === booking.id ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "500", fontFamily: "'Jost', sans-serif"}}
                        >
                          {processingId === booking.id ? t("bookings.processing") : t("bookings.accept")}
                        </button>
                        <button
                          onClick={() => handleBookingStatus(booking.id, "declined")}
                          disabled={processingId === booking.id}
                          style={{flex: 1, backgroundColor: "transparent", color: "#1A0E06", padding: "10px", borderRadius: "999px", border: "1px solid #E2D5C8", cursor: processingId === booking.id ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: "'Jost', sans-serif", opacity: processingId === booking.id ? 0.5 : 1}}
                        >
                          {t("bookings.decline")}
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      confirmCancelId === booking.id ? (
                        <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"}}>
                          <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                            {t("bookings.cancelConfirm")}
                          </p>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
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
                    {booking.status === "completed" && (
                      <a
                        href={`/photographer-dashboard/deliver/${booking.id}`}
                        style={{fontSize: "13px", color: "#FDFBF8", backgroundColor: "#7c3aed", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", display: "inline-block"}}
                      >
                        {t("bookings.deliverPhotos")}
                      </a>
                    )}
                    {booking.status === "photos_delivered" && (
                      <div style={{display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap"}}>
                        <span style={{fontSize: "12px", color: "#7c3aed", fontFamily: "'Jost', sans-serif"}}>
                          {t("bookings.payoutDue", { date: booking.payout_due_at ? new Date(booking.payout_due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "soon" })}
                        </span>
                        <a
                          href={`/photographer-dashboard/deliver/${booking.id}`}
                          style={{fontSize: "12px", color: "#7c3aed", border: "1px solid #ddd6fe", padding: "5px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}
                        >
                          {t("bookings.addMorePhotos")}
                        </a>
                        <a
                          href={`/deliveries/${booking.id}`}
                          style={{fontSize: "12px", color: "#7A5C44", border: "1px solid #E2D5C8", padding: "5px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}
                        >
                          {t("bookings.viewDelivery")}
                        </a>
                      </div>
                    )}
                    {booking.status === "paid_out" && (
                      <span style={{fontSize: "12px", color: "#15803d", fontFamily: "'Jost', sans-serif"}}>{t("bookings.paymentReleased")}</span>
                    )}
                    {booking.status === "disputed" && (
                      <span style={{fontSize: "12px", color: "#b45309", fontFamily: "'Jost', sans-serif"}}>{t("bookings.underAdminReview")}</span>
                    )}
                    <a href={`/messages/${booking.id}`} style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", border: "1px solid #E2D5C8", padding: "8px 20px", borderRadius: "999px", display: "inline-block", fontFamily: "'Jost', sans-serif"}}>
                      {t("bookings.messageClient")}
                    </a>
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
                  <li>{t("account.warning4")}</li>
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
        {/* /Overview tab */}

        {/* Earnings tab */}
        {activeTab === "earnings" && (() => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const confirmedBookings = bookings.filter(b => b.status === "confirmed");
          const completedBookings = confirmedBookings.filter(b => b.date && new Date(b.date + "T00:00:00") < now);
          const upcomingBookings = confirmedBookings.filter(b => !b.date || new Date(b.date + "T00:00:00") >= now);
          const totalEarned = completedBookings.reduce((s, b) => s + parsePrice(b.price) * 0.9, 0);
          const pendingEarnings = upcomingBookings.reduce((s, b) => s + parsePrice(b.price) * 0.9, 0);
          const currency = earningsData?.currency ?? "usd";

          const payoutStatusStyle = (s: string) => {
            if (s === "paid") return { backgroundColor: "#f0fdf4", color: "#15803d" };
            if (s === "in_transit") return { backgroundColor: "#eff6ff", color: "#1d4ed8" };
            if (s === "failed") return { backgroundColor: "#fef2f2", color: "#dc2626" };
            return { backgroundColor: "#FBF0EA", color: "#C8622A" };
          };

          const earningRows = bookings.filter(b =>
            b.status === "confirmed" || b.status === "completed" ||
            b.status === "photos_delivered" || b.status === "paid_out" ||
            b.status === "disputed" || b.status === "cancelled"
          );

          return (
            <div>
              {earningsLoading ? (
                <div style={{textAlign: "center", padding: "48px 0"}}>
                  <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>{t("earnings.loadingStripe")}</p>
                </div>
              ) : (
                <>
                  {earningsError && (
                    <div style={{marginBottom: "24px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E"}}>
                      <p style={{fontSize: "12px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif"}}>{earningsError}</p>
                    </div>
                  )}

                  {/* 4 stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      {
                        label: t("earnings.totalEarned"),
                        value: `~${fmtMoney(totalEarned, currency)}`,
                        desc: t("earnings.completedSessions", { count: completedBookings.length }),
                        note: t("earnings.afterFee"),
                      },
                      {
                        label: t("earnings.pendingEarnings"),
                        value: `~${fmtMoney(pendingEarnings, currency)}`,
                        desc: t("earnings.upcomingSessions", { count: upcomingBookings.length }),
                        note: t("earnings.awaitingCompletion"),
                      },
                      {
                        label: t("earnings.availableForPayout"),
                        value: earningsData?.noStripeAccount ? "—" : fmtMoney(earningsData?.stripeAvailable ?? 0, currency),
                        desc: earningsData?.noStripeAccount ? t("earnings.connectStripe") : t("earnings.readyForPayout"),
                        note: t("earnings.fromStripe"),
                      },
                      {
                        label: t("earnings.inTransit"),
                        value: earningsData?.noStripeAccount ? "—" : fmtMoney(earningsData?.stripePending ?? 0, currency),
                        desc: earningsData?.noStripeAccount ? t("earnings.connectStripe") : t("earnings.processingDays"),
                        note: t("earnings.fromStripe"),
                      },
                    ].map((stat) => (
                      <div key={stat.label} style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "20px", border: "1px solid #E2D5C8"}}>
                        <p style={{fontSize: "11px", color: "#7A5C44", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{stat.label.toUpperCase()}</p>
                        <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: "400", color: "#1A0E06", margin: "0 0 4px", letterSpacing: "-0.02em", lineHeight: "1.2"}}>{stat.value}</p>
                        <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{stat.desc}</p>
                        <p style={{fontSize: "10px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>{stat.note}</p>
                      </div>
                    ))}
                  </div>

                  {/* Payout history */}
                  <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", marginBottom: "24px"}}>
                    <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("earnings.payoutHistoryLabel")}</p>
                    <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1A0E06", margin: "0 0 20px", letterSpacing: "-0.02em"}}>
                      {t("earnings.bankPayouts")}
                    </h2>
                    {earningsData?.noStripeAccount ? (
                      <p style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
                        {t("earnings.connectStripeDesc")}
                      </p>
                    ) : !earningsData?.payouts?.length ? (
                      <p style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", fontStyle: "italic"}}>
                        {t("earnings.noPayouts")}
                      </p>
                    ) : (
                      <div style={{overflowX: "auto"}}>
                        <table style={{width: "100%", borderCollapse: "collapse"}}>
                          <thead>
                            <tr style={{borderBottom: "1px solid #E2D5C8"}}>
                              {[t("earnings.arrivalDate"), t("earnings.amount"), t("earnings.status"), t("earnings.reference")].map(h => (
                                <th key={h} style={{textAlign: "left", padding: "8px 12px 12px 0", fontSize: "11px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em"}}>{h.toUpperCase()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(earningsData.payouts as any[]).map((payout: any) => {
                              const s = payoutStatusStyle(payout.status);
                              return (
                                <tr key={payout.id} style={{borderBottom: "1px solid #F5EFE4"}}>
                                  <td style={{padding: "12px 12px 12px 0", fontSize: "13px", color: "#1A0E06", fontFamily: "'Jost', sans-serif"}}>
                                    {new Date(payout.arrival_date * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                  </td>
                                  <td style={{padding: "12px 12px 12px 0", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#1A0E06"}}>
                                    {fmtMoney(payout.amount, payout.currency)}
                                  </td>
                                  <td style={{padding: "12px 12px 12px 0"}}>
                                    <span style={{...s, fontSize: "11px", padding: "3px 10px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                                      {payout.status.replace("_", " ").charAt(0).toUpperCase() + payout.status.replace("_", " ").slice(1)}
                                    </span>
                                  </td>
                                  <td style={{padding: "12px 0 12px 0", fontSize: "11px", color: "#DDD0C0", fontFamily: "'Jost', sans-serif"}}>
                                    {payout.id}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Per-booking breakdown */}
                  <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8"}}>
                    <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("earnings.breakdownLabel")}</p>
                    <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1A0E06", margin: "0 0 4px", letterSpacing: "-0.02em"}}>
                      {t("earnings.earningsByBooking")}
                    </h2>
                    <p style={{fontSize: "12px", color: "#7A5C44", margin: "0 0 20px", fontFamily: "'Jost', sans-serif"}}>
                      {t("earnings.breakdownDesc")}
                    </p>
                    {earningRows.length === 0 ? (
                      <p style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", fontStyle: "italic"}}>{t("earnings.noBookings")}</p>
                    ) : (
                      <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                        {earningRows.map((booking) => {
                          const gross = parsePrice(booking.price);
                          const fee = gross * 0.1;
                          const net = gross * 0.9;
                          const isPast = booking.date && new Date(booking.date + "T00:00:00") < now;
                          const rowStatus = booking.status === "cancelled"
                            ? { label: t("earnings.statusCancelled"), bg: "#fef2f2", color: "#dc2626" }
                            : booking.status === "disputed"
                            ? { label: t("earnings.statusDisputed"), bg: "#fef3c7", color: "#b45309" }
                            : booking.status === "paid_out"
                            ? { label: t("earnings.statusPaidOut"), bg: "#f0fdf4", color: "#15803d" }
                            : booking.status === "photos_delivered"
                            ? { label: t("earnings.statusPhotosDelivered"), bg: "#faf5ff", color: "#7c3aed" }
                            : booking.status === "completed"
                            ? { label: t("earnings.statusCompleted"), bg: "#eff6ff", color: "#1d4ed8" }
                            : isPast
                            ? { label: t("earnings.statusEarned"), bg: "#f0fdf4", color: "#15803d" }
                            : { label: t("earnings.statusUpcoming"), bg: "#FBF0EA", color: "#C8622A" };
                          return (
                            <div key={booking.id} style={{border: "1px solid #E2D5C8", borderRadius: "10px", padding: "16px 20px", backgroundColor: "#FDFBF8"}}>
                              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px"}}>
                                <div>
                                  <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "17px", fontWeight: "500", color: "#1A0E06", margin: "0 0 2px"}}>{booking.client_name}</p>
                                  <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>{booking.session_type}{booking.date ? ` — ${booking.date}` : ""}</p>
                                </div>
                                <span style={{...rowStatus, fontSize: "11px", padding: "3px 10px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", fontWeight: "500", flexShrink: 0}}>
                                  {rowStatus.label}
                                </span>
                              </div>
                              <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", borderTop: "1px solid #E2D5C8", paddingTop: "12px"}}>
                                <div>
                                  <p style={{fontSize: "10px", color: "#DDD0C0", margin: "0 0 3px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("earnings.sessionFee")}</p>
                                  <p style={{fontSize: "15px", color: "#1A0E06", margin: "0", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>{convertPrice(booking.price) || "—"}</p>
                                </div>
                                <div>
                                  <p style={{fontSize: "10px", color: "#DDD0C0", margin: "0 0 3px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("earnings.lomissaFee")}</p>
                                  <p style={{fontSize: "15px", color: "#dc2626", margin: "0", fontFamily: "'Cormorant Garamond', Georgia, serif"}}>−{fee.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p style={{fontSize: "10px", color: "#DDD0C0", margin: "0 0 3px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>{t("earnings.youReceive")}</p>
                                  <p style={{fontSize: "15px", color: booking.status === "cancelled" ? "#DDD0C0" : "#15803d", margin: "0", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: "500"}}>{booking.status === "cancelled" ? "—" : net.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })()}
        {/* /Earnings tab */}

      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}