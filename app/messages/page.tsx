"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function Messages() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .or(`client_id.eq.${user.id},photographer_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!bookings) { setLoading(false); return; }

      const conversationsWithMessages = await Promise.all(
        bookings.map(async (booking) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("booking_id", booking.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("booking_id", booking.id)
            .eq("receiver_id", user.id)
            .eq("read", false);

          return {
            ...booking,
            lastMessage: messages?.[0] || null,
            unreadCount: count || 0,
          };
        })
      );

      setConversations(conversationsWithMessages);
      setLoading(false);
    };
    init();
  }, []);

  const isPhotographer = user?.user_metadata?.role === "photographer";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
      <p style={{fontSize: "13px", color: "#B85528", fontFamily: "'Jost', sans-serif"}}>Loading messages...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-6">
          <a href={isPhotographer ? "/photographer-dashboard" : "/dashboard"} style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Dashboard</a>
          <a href={isPhotographer ? "/photographer-dashboard" : "/dashboard"} style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>My account</a>
        </div>
      </nav>

      <div style={{maxWidth: "720px", margin: "0 auto", padding: "48px 32px"}}>
        <div style={{marginBottom: "32px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>INBOX</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1C1009", margin: "0", letterSpacing: "-0.02em"}}>Messages</h1>
        </div>

        {conversations.length === 0 ? (
          <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "48px", border: "1px solid #E4D8C4", textAlign: "center"}}>
            <div style={{fontSize: "48px", marginBottom: "16px"}}>💬</div>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", color: "#1C1009", margin: "0 0 8px"}}>No messages yet</p>
            <p style={{fontSize: "14px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>Messages from your bookings will appear here.</p>
          </div>
        ) : (
          <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
            {conversations.map((conv) => (
              <a key={conv.id} href={`/messages/${conv.id}`} style={{textDecoration: "none", backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "20px 24px", border: conv.unreadCount > 0 ? "1px solid #B85528" : "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px"}}>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px"}}>
                    <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1C1009", margin: "0"}}>
                      {isPhotographer ? conv.client_name || "Client" : conv.photographer_name}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "11px", padding: "2px 8px", borderRadius: "999px", fontWeight: "600", fontFamily: "'Jost', sans-serif"}}>
                        {conv.unreadCount} new
                      </span>
                    )}
                  </div>
                  <p style={{fontSize: "12px", color: "#B85528", margin: "0 0 4px", fontFamily: "'Jost', sans-serif"}}>{conv.session_type} — {conv.date}</p>
                  {conv.lastMessage ? (
                    <p style={{fontSize: "13px", color: "#9E7250", margin: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Jost', sans-serif"}}>
                      {conv.lastMessage.sender_id === user?.id ? "You: " : ""}{conv.lastMessage.content}
                    </p>
                  ) : (
                    <p style={{fontSize: "13px", color: "#C3AB88", margin: "0", fontStyle: "italic", fontFamily: "'Jost', sans-serif"}}>No messages yet — start the conversation</p>
                  )}
                </div>
                <div style={{fontSize: "18px", color: "#C3AB88", flexShrink: 0}}>→</div>
              </a>
            ))}
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