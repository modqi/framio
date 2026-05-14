"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";
import { useTranslations } from "../../../lib/i18n";

export default function Availability() {
  const t = useTranslations("Availability");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blockedDays, setBlockedDays] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      if (user.user_metadata?.role !== "photographer") { window.location.href = "/dashboard"; return; }
      setUser(user);
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const { data } = await supabase
        .from("availability")
        .select("*")
        .eq("photographer_id", user.id)
        .eq("is_available", false)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0]);
      const blocked = new Set<string>((data || []).map((row: any) => row.date));
      setBlockedDays(blocked);
      setLoading(false);
    };
    getUser();
  }, [currentMonth]);

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${month}-${d}`;
  };

  const isPast = (day: number) => {
    const date = new Date(formatDate(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const toggleDay = (day: number) => {
    if (isPast(day)) return;
    const dateStr = formatDate(day);
    setBlockedDays(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) { next.delete(dateStr); }
      else { next.add(dateStr); }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(d);
      if (isPast(d)) continue;
      const is_available = !blockedDays.has(dateStr);
      await supabase.from("availability").upsert(
        { photographer_id: user.id, date: dateStr, is_available },
        { onConflict: "photographer_id,date" }
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  const days = getDaysInMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const blockedCount = blockedDays.size;
  const availableCount = daysInMonth - blockedCount;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/photographer-dashboard" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>{t("nav.dashboard")}</a>
      </nav>

      <div style={{maxWidth: "680px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {t("heading")}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
            {t("description")}
          </p>
        </div>

        {/* Stats strip */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "16px 24px", border: "1px solid #E2D5C8", marginBottom: "24px", display: "flex", gap: "32px"}}>
          <div>
            <p style={{fontSize: "11px", color: "#7A5C44", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("stats.availableDays")}</p>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0"}}>{availableCount}</p>
          </div>
          <div>
            <p style={{fontSize: "11px", color: "#7A5C44", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("stats.blockedDays")}</p>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#C8622A", margin: "0"}}>{blockedCount}</p>
          </div>
          <div>
            <p style={{fontSize: "11px", color: "#7A5C44", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{t("stats.month")}</p>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0"}}>{currentMonth.toLocaleString("default", { month: "short" })}</p>
          </div>
        </div>

        {/* Calendar */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "32px", border: "1px solid #E2D5C8", marginBottom: "24px"}}>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} disabled={isCurrentMonth} style={{border: "1px solid #e5e5e5", backgroundColor: "#fff", borderRadius: "8px", padding: "8px 16px", cursor: isCurrentMonth ? "not-allowed" : "pointer", fontSize: "13px", color: isCurrentMonth ? "#ccc" : "#1a1a1a", opacity: isCurrentMonth ? 0.5 : 1}}>
              {t("calendar.prev")}
            </button>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1A0E06", margin: "0"}}>{monthName}</p>
            <button onClick={nextMonth} style={{border: "1px solid #e5e5e5", backgroundColor: "#fff", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", color: "#1a1a1a"}}>
              {t("calendar.next")}
            </button>
          </div>

          {/* Day labels */}
          <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "8px"}}>
            {(["mo", "tu", "we", "th", "fr", "sa", "su"] as const).map(d => (
              <div key={d} style={{textAlign: "center", fontSize: "11px", color: "#888", padding: "4px"}}>{t(`calendar.${d}` as any)}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px"}}>
            {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`}/>;
              const dateStr = formatDate(day);
              const isBlocked = blockedDays.has(dateStr);
              const past = isPast(day);
              return (
                <div
                  key={day}
                  onClick={() => toggleDay(day)}
                  style={{
                    textAlign: "center",
                    padding: "10px 4px",
                    fontSize: "13px",
                    borderRadius: "8px",
                    cursor: past ? "not-allowed" : "pointer",
                    backgroundColor: past ? "#FDFBF8" : isBlocked ? "#F5EFE4" : "#FDFBF8",
                    color: past ? "#DDD0C0" : isBlocked ? "#DDD0C0" : "#1A0E06",
                    border: past ? "1px solid #E2D5C8" : isBlocked ? "1px solid #E2D5C8" : "1px solid #E2D5C8",
                    fontWeight: isBlocked ? "400" : "500",
                    textDecoration: isBlocked ? "line-through" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{display: "flex", gap: "20px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #E2D5C8"}}>
            <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
              <div style={{width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#FDFBF8", border: "1px solid #E2D5C8"}}></div>
              <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("calendar.available")}</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
              <div style={{width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#F5EFE4", border: "1px solid #E2D5C8"}}></div>
              <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("calendar.unavailable")}</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
              <div style={{width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#FDFBF8", border: "1px solid #E2D5C8"}}></div>
              <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("calendar.past")}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{backgroundColor: "#FDFBF8", borderRadius: "12px", padding: "20px 24px", border: "1px solid #E2D5C8", marginBottom: "24px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("howItWorks.label")}</p>
          <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
            {([t("howItWorks.tip1"), t("howItWorks.tip2"), t("howItWorks.tip3"), t("howItWorks.tip4")] as string[]).map((tip, i) => (
              <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start"}}>
                <span style={{fontSize: "12px", color: "#C8622A", flexShrink: 0, fontFamily: "'Jost', sans-serif"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {saved && (
          <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", marginBottom: "16px", textAlign: "center"}}>
            <p style={{fontSize: "13px", color: "#15803d", margin: "0"}}>{t("saved")}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{width: "100%", backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "14px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}
        >
          {saving ? t("saving") : t("save")}
        </button>

      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}