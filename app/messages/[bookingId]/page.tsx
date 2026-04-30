"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";

export default function Conversation({ params }: { params: any }) {
  const bookingId = params?.bookingId;
  const [user, setUser] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);

      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (!booking) { window.location.href = "/messages"; return; }
      setBooking(booking);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      const channel = supabase
        .channel("messages:" + bookingId)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "booking_id=eq." + bookingId,
        }, (payload: any) => {
          setMessages((prev: any[]) => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !booking) return;
    setSending(true);
    const receiverId = user.id === booking.client_id ? booking.photographer_id : booking.client_id;
    const { error } = await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: newMessage.trim(),
      read: false,
    });
    if (!error) { setNewMessage(""); }
    setSending(false);
  };

  const isPhotographer = user?.user_metadata?.role === "photographer";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAFAF8"}}>
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading conversation...</p>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col" style={{backgroundColor: "#FAFAF8"}}>
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
        <a href="/messages" style={{fontSize: "13px", color: "#888", textDecoration: "none"}}>Back to messages</a>
      </nav>
      <div style={{backgroundColor: "#fff", borderBottom: "1px solid #f0f0f0", padding: "16px 32px"}}>
        <div style={{maxWidth: "720px", margin: "0 auto"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 4px", letterSpacing: "1px"}}>{booking?.session_type} - {booking?.date}</p>
          <h2 style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: "0"}}>
            {isPhotographer ? booking?.client_name || "Client" : booking?.photographer_name}
          </h2>
        </div>
      </div>
      <div style={{flex: 1, overflowY: "auto", padding: "24px 32px"}}>
        <div style={{maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px"}}>
          {messages.length === 0 ? (
            <div style={{textAlign: "center", padding: "48px 0"}}>
              <p style={{fontSize: "14px", color: "#aaa", fontStyle: "italic"}}>No messages yet - start the conversation!</p>
            </div>
          ) : messages.map((msg: any) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} style={{display: "flex", justifyContent: isMe ? "flex-end" : "flex-start"}}>
                <div style={{maxWidth: "70%", backgroundColor: isMe ? "#1a1a1a" : "#fff", color: isMe ? "#fff" : "#1a1a1a", padding: "12px 16px", borderRadius: isMe ? "12px 12px 0 12px" : "12px 12px 12px 0", border: isMe ? "none" : "1px solid #f0f0f0"}}>
                  <p style={{fontSize: "14px", margin: "0 0 4px", lineHeight: "1.6"}}>{msg.content}</p>
                  <p style={{fontSize: "11px", margin: "0", color: isMe ? "rgba(255,255,255,0.5)" : "#aaa"}}>
                    {new Date(msg.created_at).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>
      </div>
      <div style={{backgroundColor: "#fff", borderTop: "1px solid #f0f0f0", padding: "16px 32px"}}>
        <div style={{maxWidth: "720px", margin: "0 auto", display: "flex", gap: "12px", alignItems: "flex-end"}}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder="Type a message..."
            rows={1}
            style={{flex: 1, border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", resize: "none", fontFamily: "inherit"}}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            style={{backgroundColor: "#C4907A", color: "#fff", fontSize: "13px", padding: "12px 24px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", flexShrink: 0, opacity: !newMessage.trim() ? 0.5 : 1}}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}