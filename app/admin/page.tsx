import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminPanel from "./_client";

// Server-side guard: redirect before serving any HTML if no session cookie is present.
// The lomissa-session cookie is written by SessionSync (app/components/SessionSync.tsx)
// whenever supabase.auth fires SIGNED_IN / TOKEN_REFRESHED. Full role and admin_users
// table verification still happens inside AdminPanel on the client.
export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!cookieStore.has("lomissa-session")) {
    redirect("/login");
  }
  return <AdminPanel />;
}
