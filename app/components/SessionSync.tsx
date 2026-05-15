"use client";
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

// Writes a lightweight flag cookie whenever the auth state changes.
// Next.js Server Components can read this cookie to redirect unauthenticated
// requests before serving any HTML — without requiring @supabase/ssr.
export default function SessionSync() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        document.cookie = "lomissa-session=1; path=/; max-age=604800; SameSite=Lax";
      } else if (event === "SIGNED_OUT") {
        document.cookie = "lomissa-session=; path=/; max-age=0";
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}
