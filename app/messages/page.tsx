"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function Messages() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  const fetchConversations = async () => {
    const uid = userIdRef.current;
    if (!uid) return;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .or(`client_id.eq.${uid},photographer_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (!bookings || bookings.length === 0) {
      setConversations([]);
      return;
    }

    const bookingIds = bookings.map((b) => b.id);

    const [{ data: allMessages }, { data: unreadRows }, { data: deletions }] =
      await Promise.all([
        supabase
          .from("messages")
          .select("id, booking_id, sender_id, content, created_at")
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("messages")
          .select("booking_id, created_at")
          .in("booking_id", bookingIds)
          .eq("receiver_id", uid)
          .eq("read", false),
        supabase
          .from("conversation_deletions")
          .select("booking_id, deleted_at")
          .eq("user_id", uid),
      ]);

    // Most-recent message per booking (allMessages is newest-first)
    const lastByBooking: Record<string, any> = {};
    for (const m of allMessages ?? []) {
      if (!lastByBooking[m.booking_id]) lastByBooking[m.booking_id] = m;
    }

    // deletion timestamp per booking for this user
    const deletionMap = new Map(
      (deletions ?? []).map((d: any) => [d.booking_id, d.deleted_at])
    );

    // A conversation is visible when:
    //   (a) never deleted, OR
    //   (b) deleted but a new message arrived after the deletion timestamp
    //       (WhatsApp-style reappearance)
    const isVisible = (bookingId: string): boolean => {
      const deletedAt = deletionMap.get(bookingId);
      if (!deletedAt) return true;
      const last = lastByBooking[bookingId];
      return !!last && new Date(last.created_at) > new Date(deletedAt);
    };

    // Only count unread messages that arrived after any deletion timestamp
    const unreadByBooking: Record<string, number> = {};
    for (const m of (unreadRows ?? []) as any[]) {
      const deletedAt = deletionMap.get(m.booking_id);
      if (deletedAt && new Date(m.created_at) <= new Date(deletedAt)) continue;
      unreadByBooking[m.booking_id] = (unreadByBooking[m.booking_id] ?? 0) + 1;
    }

    const visible = bookings
      .filter((b) => isVisible(b.id) && lastByBooking[b.id])
      .map((b) => ({
        ...b,
        lastMessage: lastByBooking[b.id],
        unreadCount: unreadByBooking[b.id] ?? 0,
      }))
      .sort(
        (a, b) =>
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime()
      );

    setConversations(visible);
  };

  useEffect(() => {
    let readChannel: any;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);
      userIdRef.current = user.id;
      await fetchConversations();
      setLoading(false);

      // Subscribe to message INSERT and UPDATE events so the inbox refreshes
      // when new messages arrive (conversations reappear after deletion) and
      // when messages are read in another tab/device (badge clears).
      // Requires: ALTER TABLE messages REPLICA IDENTITY FULL; in Supabase.
      readChannel = supabase
        .channel("inbox-reads:" + user.id)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "receiver_id=eq." + user.id,
        }, () => {
          fetchConversations();
        })
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: "receiver_id=eq." + user.id,
        }, () => {
          fetchConversations();
        })
        .subscribe();
    };

    init();
    window.addEventListener("focus", fetchConversations);
    return () => {
      window.removeEventListener("focus", fetchConversations);
      if (readChannel) supabase.removeChannel(readChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteConversation = async (bookingId: string) => {
    if (!user) return;
    setDeletingId(bookingId);
    await supabase
      .from("conversation_deletions")
      .upsert(
        { user_id: user.id, booking_id: bookingId, deleted_at: new Date().toISOString() },
        { onConflict: "user_id,booking_id" }
      );
    setConversations((prev) => prev.filter((c) => c.id !== bookingId));
    setConfirmDeleteId(null);
    setDeletingId(null);
  };

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
        <a href={isPhotographer ? "/photographer-dashboard" : "/dashboard"} style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>Dashboard</a>
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
              <div key={conv.id} style={{position: "relative"}}>
                {confirmDeleteId === conv.id ? (
                  /* Confirmation state */
                  <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "20px 24px", border: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px"}}>
                    <p style={{fontSize: "13px", color: "#1C1009", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                      Delete this conversation? This cannot be undone.
                    </p>
                    <div style={{display: "flex", gap: "8px", flexShrink: 0}}>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        style={{fontSize: "12px", color: "#7A5235", background: "none", border: "1px solid #E4D8C4", borderRadius: "999px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteConversation(conv.id)}
                        disabled={deletingId === conv.id}
                        style={{fontSize: "12px", color: "#FAF7F1", backgroundColor: "#B85528", border: "none", borderRadius: "999px", padding: "6px 14px", cursor: deletingId === conv.id ? "default" : "pointer", fontFamily: "'Jost', sans-serif", fontWeight: "500", opacity: deletingId === conv.id ? 0.6 : 1}}
                      >
                        {deletingId === conv.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal state */
                  <a href={`/messages/${conv.id}`} style={{textDecoration: "none", backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "20px 24px", border: conv.unreadCount > 0 ? "1px solid #B85528" : "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px"}}>
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
                    <div style={{display: "flex", alignItems: "center", gap: "12px", flexShrink: 0}}>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(conv.id); }}
                        title="Delete conversation"
                        style={{background: "none", border: "none", cursor: "pointer", color: "#C3AB88", fontSize: "16px", padding: "4px", lineHeight: "1", display: "flex", alignItems: "center"}}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 3.5h12M5.5 3.5V2h3v1.5M2.5 3.5l.75 8.5h7.5l.75-8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <div style={{fontSize: "18px", color: "#C3AB88"}}>→</div>
                    </div>
                  </a>
                )}
              </div>
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
