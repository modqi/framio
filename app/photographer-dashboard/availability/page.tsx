"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function Availability() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<{[key: string]: boolean}>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const { data } = await supabase
        .from("availability")
        .select("*")
        .eq("photographer_id", user.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0]);
      const avMap: {[key: string]: boolean} = {};
      (data || []).forEach((row: any) => { avMap[row.date] = row.is_available; });
      setAvailability(avMap);
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
    setAvailability(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const entries = Object.entries(availability).map(([date, is_available]) => ({
      photographer_id: user.id,
      date,
      is_available,
    }));
    for (const entry of entries) {
      await supabase.from("availability").upsert(entry, {
        onConflict: "photographer_id,date",
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  const days = getDaysInMonth();
  const availableCount = Object.values(availability).filter(v => v).length;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <a href="/photographer-dashboard" style={{fontSize: "12px", color: "#888", textDecoration: "none", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px"}}>
          Back to dashboard
        </a>
      </nav>

      <div style={{maxWidth: "680px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>My schedule</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
            My availability
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>
            Tap days to mark them as available — clients can only book available days
          </p>
        </div>

        {/* Stats strip */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "16px 24px", border: "1px solid #f0f0f0", marginBottom: "24px", display: "flex", gap: "32px"}}>
          <div>
            <p style={{fontSize: "11px", color: "#888", margin: "0 0 4px"}}>Available this month</p>
            <p style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#C4907A", margin: "0"}}>{availableCount}</p>
          </div>
          <div>
            <p style={{fontSize: "11px", color: "#888", margin: "0 0 4px"}}>Days remaining</p>
            <p style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0"}}>
              {new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() - availableCount}
            </p>
          </div>
          <div>
            <p style={{fontSize: "11px", color: "#888", margin: "0 0 4px"}}>Month</p>
            <p style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0"}}>{currentMonth.toLocaleString("default", { month: "short" })}</p>
          </div>
        </div>

        {/* Calendar */}
        <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #f0f0f0", marginBottom: "24px"}}>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} style={{border: "1px solid #e5e5e5", backgroundColor: "#fff", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", color: "#1a1a1a"}}>
              ← Prev
            </button>
            <p style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: "0"}}>{monthName}</p>
            <button onClick={nextMonth} style={{border: "1px solid #e5e5e5", backgroundColor: "#fff", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", color: "#1a1a1a"}}>
              Next →
            </button>
          </div>

          {/* Day labels */}
          <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "8px"}}>
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
              <div key={d} style={{textAlign: "center", fontSize: "11px", color: "#888", padding: "4px"}}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px"}}>
            {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`}/>;
              const dateStr = formatDate(day);
              const isAvailable = availability[dateStr] === true;
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
                    backgroundColor: past ? "#fafafa" : isAvailable ? "#C4907A" : "#fff",
                    color: past ? "#ccc" : isAvailable ? "#fff" : "#1a1a1a",
                    border: past ? "1px solid #f5f5f5" : isAvailable ? "1px solid #C4907A" : "1px solid #e5e5e5",
                    fontWeight: isAvailable ? "600" : "400",
                    transition: "all 0.15s",
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{display: "flex", gap: "20px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #f0f0f0"}}>
            <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
              <div style={{width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#C4907A"}}></div>
              <span style={{fontSize: "12px", color: "#888"}}>Available</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
              <div style={{width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#fff", border: "1px solid #e5e5e5"}}></div>
              <span style={{fontSize: "12px", color: "#888"}}>Not available</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
              <div style={{width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#fafafa", border: "1px solid #f5f5f5"}}></div>
              <span style={{fontSize: "12px", color: "#888"}}>Past</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{backgroundColor: "#FDF8F5", borderRadius: "12px", padding: "20px 24px", border: "1px solid #f0e8e0", marginBottom: "24px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>How it works</p>
          <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
            {[
              "Tap any future day to mark it as available",
              "Tap again to mark it as unavailable",
              "Click Save when you are done",
              "Clients can only book your available days",
            ].map((tip, i) => (
              <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start"}}>
                <span style={{fontSize: "12px", color: "#C4907A", flexShrink: 0}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#888"}}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {saved && (
          <div style={{padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", marginBottom: "16px", textAlign: "center"}}>
            <p style={{fontSize: "13px", color: "#15803d", margin: "0"}}>Availability saved successfully ✓</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{width: "100%", backgroundColor: "#C4907A", color: "#fff", fontSize: "14px", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600"}}
        >
          {saving ? "Saving..." : "Save availability"}
        </button>

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