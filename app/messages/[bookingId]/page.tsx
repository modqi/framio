"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";

export default function Conversation({ params }: { params: any }) {
  const [user, setUser] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [resolvedBookingId, setResolvedBookingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const resolveParams = async () => {
      let id;
      if (typeof params?.then === "function") {
        const resolved = await params;
        id = resolved?.bookingId;
      } else {
        id = params?.bookingId;
      }
      setResolvedBookingId(id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!resolvedBookingId) return;
    let channel: any;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);
      userRef.current = user;

      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", resolvedBookingId)
        .single();

      if (!booking) { window.location.href = "/messages"; return; }
      if (booking.client_id !== user.id && booking.photographer_id !== user.id) {
        window.location.href = "/messages";
        return;
      }
      setBooking(booking);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", resolvedBookingId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      // Mark unread messages as read in the DB immediately — before the channel
      // connects — so navigating back to the inbox always sees the correct count.
      const hasUnread = (msgs || []).some((m: any) => m.receiver_id === user.id && !m.read);
      if (hasUnread) {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("booking_id", resolvedBookingId)
          .eq("receiver_id", user.id)
          .eq("read", false);

        setMessages((prev) => prev.map((m) =>
          m.receiver_id === user.id ? { ...m, read: true } : m
        ));
      }

      // Set up channel. The broadcast must only fire once the WebSocket is
      // SUBSCRIBED — calling channel.send() before that silently drops the
      // message because the socket handshake hasn't completed yet.
      channel = supabase
        .channel("messages:" + resolvedBookingId)
        .on("broadcast", { event: "read" }, ({ payload }: any) => {
          // Fast-path: other party sent a broadcast right after subscribing
          setMessages((prev) => prev.map((m) =>
            m.receiver_id === payload.readerId ? { ...m, read: true } : m
          ));
        })
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "booking_id=eq." + resolvedBookingId,
        }, (payload: any) => {
          const incoming = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            if (incoming.receiver_id === userRef.current?.id) {
              // Auto-mark as read since we're in the conversation; channel is
              // already SUBSCRIBED here so send() will deliver.
              supabase.from("messages").update({ read: true }).eq("id", incoming.id);
              channel.send({ type: "broadcast", event: "read", payload: { readerId: userRef.current.id } });
              return [...prev, { ...incoming, read: true }];
            }
            return [...prev, incoming];
          });
        })
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: "booking_id=eq." + resolvedBookingId,
        }, (payload: any) => {
          // Reliable DB-driven path (requires REPLICA IDENTITY FULL on messages).
          // Fires when the other party marks our messages as read, even if the
          // broadcast was dropped.
          const updated = payload.new;
          if (updated.read) {
            setMessages((prev) => prev.map((m) =>
              m.id === updated.id ? { ...m, read: true } : m
            ));
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && hasUnread) {
            // Channel is now connected — safe to broadcast read receipt.
            channel.send({ type: "broadcast", event: "read", payload: { readerId: user.id } });
          }
        });
    };

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [resolvedBookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [newMessage]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !booking || !resolvedBookingId) return;
    setSending(true);
    setSendError(null);
    const receiverId = user.id === booking.client_id ? booking.photographer_id : booking.client_id;
    const content = newMessage.trim();
    const { data: inserted, error } = await supabase.from("messages").insert({
      booking_id: resolvedBookingId,
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      read: false,
    }).select().single();
    if (!error && inserted) {
      // Add immediately; the INSERT subscription deduplicates by id
      setMessages((prev) => [...prev, inserted]);
      setNewMessage("");
      const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          type: "new_message",
          photographerName: booking.photographer_name,
          photographerEmail: booking.photographer_email || "hello@lomissa.com",
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          sessionType: booking.session_type,
          date: booking.date,
          location: booking.location,
          message: content,
          price: booking.price,
          senderName: user.user_metadata?.name || user.email,
          senderId: user.id,
          clientId: booking.client_id,
          bookingId: resolvedBookingId,
        }),
      });
    } else if (error) {
      setSendError("Message failed to send. Please try again.");
    }
    setSending(false);
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

    if (date >= startOfToday) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } else if (date >= startOfYesterday) {
      return "Yesterday";
    } else if (date >= startOfWeek) {
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const isPhotographer = user?.user_metadata?.role === "photographer";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
      <p style={{fontSize: "13px", color: "#B85528", fontFamily: "'Jost', sans-serif"}}>Loading conversation...</p>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/messages" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>← Back to messages</a>
      </nav>

      {/* Conversation header */}
      <div style={{backgroundColor: "#FDFBF7", borderBottom: "1px solid #E4D8C4", padding: "16px 32px"}}>
        <div style={{maxWidth: "720px", margin: "0 auto"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 4px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{booking?.session_type} — {booking?.date}</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1C1009", margin: "0"}}>
            {isPhotographer ? booking?.client_name || "Client" : booking?.photographer_name}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex: 1, overflowY: "auto", padding: "24px 32px"}}>
        <div style={{maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px"}}>
          {messages.length === 0 ? (
            <div style={{textAlign: "center", padding: "48px 0"}}>
              <p style={{fontSize: "14px", color: "#C3AB88", fontStyle: "italic", fontFamily: "'Jost', sans-serif"}}>No messages yet — start the conversation!</p>
            </div>
          ) : messages.map((msg: any) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} style={{display: "flex", justifyContent: isMe ? "flex-end" : "flex-start"}}>
                <div style={{
                  maxWidth: "70%",
                  backgroundColor: isMe ? "#1C1009" : "#FDFBF7",
                  color: isMe ? "#FAF7F1" : "#1C1009",
                  padding: "12px 16px",
                  borderRadius: isMe ? "12px 12px 0 12px" : "12px 12px 12px 0",
                  border: isMe ? "none" : "1px solid #E4D8C4",
                }}>
                  <p style={{fontSize: "14px", margin: "0 0 4px", lineHeight: "1.6", fontFamily: "'Jost', sans-serif"}}>{msg.content}</p>
                  <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px"}}>
                    <p style={{fontSize: "11px", margin: "0", color: isMe ? "rgba(250,247,241,0.4)" : "#C3AB88", fontFamily: "'Jost', sans-serif"}}>
                      {formatTimestamp(msg.created_at)}
                    </p>
                    {isMe && (
                      <span
                        title={msg.read ? "Read" : "Sent"}
                        style={{
                          fontSize: "11px",
                          lineHeight: "1",
                          color: msg.read ? "#B85528" : "rgba(250,247,241,0.35)",
                          letterSpacing: msg.read ? "-3px" : "-1px",
                          paddingRight: msg.read ? "3px" : "0",
                          userSelect: "none",
                        }}
                      >
                        {msg.read ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* Message input */}
      <div style={{backgroundColor: "#FDFBF7", borderTop: "1px solid #E4D8C4", padding: "16px 32px"}}>
        <div style={{maxWidth: "720px", margin: "0 auto"}}>
          {sendError && (
            <p style={{fontSize: "12px", color: "#dc2626", margin: "0 0 8px", fontFamily: "'Jost', sans-serif"}}>{sendError}</p>
          )}
        <div style={{display: "flex", gap: "12px", alignItems: "flex-end"}}>
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); if (sendError) setSendError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder="Type a message..."
            rows={1}
            style={{flex: 1, border: "1px solid #E4D8C4", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", outline: "none", color: "#1C1009", backgroundColor: "#FAF7F1", resize: "none", fontFamily: "'Jost', sans-serif", overflow: "hidden"}}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "12px 24px", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: "500", flexShrink: 0, opacity: !newMessage.trim() ? 0.5 : 1, fontFamily: "'Jost', sans-serif"}}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
        </div>
      </div>

    </main>
  );
}
