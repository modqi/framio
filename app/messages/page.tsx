"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

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
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAFAF8"}}>
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading messages...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
        <div className="flex items-center gap-6">
          <a href={isPhotographer ? "/photographer-dashboard" : "/dashboard"} style={{fontSize: "13px", color: "#888", textDecoration: "none"}}>Dashboard</a>
          <a href={isPhotographer ? "/photographer-dashboard" : "/dashboard"} style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "8px 20px", borderRadius: "24px", textDecoration: "none"}}>My account</a>
        </div>
      </nav>
      <div style={{maxWidth: "720px", margin: "0 auto", padding: "48px 32px"}}>
        <div style={{marginBottom: "32px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>INBOX</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0", letterSpacing: "-1px"}}>Messages</h1>
        </div>
        {conversations.length === 0 ? (
          <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "48px", border: "1px solid #f0f0f0", textAlign: "center"}}>
            <div style={{fontSize: "48px", marginBottom: "16px"}}>💬</div>
            <p style={{fontFamily: "Georgia, serif", fontSize: "20px", color: "#1a1a1a", margin: "0 0 8px"}}>No messages yet</p>
            <p style={{fontSize: "14px", color: "#888", margin: "0"}}>Messages from your bookings will appear here.</p>
          </div>
        ) : (
          <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
            {conversations.map((conv) => (
              <a key={conv.id} href={`/messages/${conv.id}`} style={{textDecoration: "none", backgroundColor: "#fff", borderRadius: "12px", padding: "20px 24px", border: conv.unreadCount > 0 ? "1px solid #C4907A" : "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px"}}>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px"}}>
                    <p style={{fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "700", color: "#1a1a1a", margin: "0"}}>
                      {isPhotographer ? conv.client_name || "Client" : conv.photographer_name}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span style={{backgroundColor: "#C4907A", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600"}}>
                        {conv.unreadCount} new
                      </span>
                    )}
                  </div>
                  <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 4px"}}>{conv.session_type} — {conv.date}</p>
                  {conv.lastMessage ? (
                    <p style={{fontSize: "13px", color: "#888", margin: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                      {conv.lastMessage.sender_id === user?.id ? "You: " : ""}{conv.lastMessage.content}
                    </p>
                  ) : (
                    <p style={{fontSize: "13px", color: "#aaa", margin: "0", fontStyle: "italic"}}>No messages yet — start the conversation</p>
                  )}
                </div>
                <div style={{fontSize: "20px", color: "#ddd", flexShrink: 0}}>→</div>
              </a>
            ))}
          </div>
        )}
      </div>
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0"}}>Lomissa</p>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>
    </main>
  );
}