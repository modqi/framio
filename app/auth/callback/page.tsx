"use client";
import { useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    const handle = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      const role = session.user.user_metadata?.role;
      if (!role) {
        // Assign role server-side so the write comes from the service role, not the user's own session
        await fetch("/api/auth/set-client-role", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        window.location.href = "/dashboard";
        return;
      }
      if (role === "pending_photographer") window.location.href = "/pending";
      else if (role === "photographer") window.location.href = "/photographer-dashboard";
      else if (role === "admin") window.location.href = "/admin";
      else window.location.href = "/dashboard";
    };
    handle();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FDFBF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "#7A5C44", letterSpacing: "0.05em" }}>Signing you in…</p>
    </div>
  );
}
