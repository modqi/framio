import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (!user) {
    console.error("[admin/clients] auth failed:", authError?.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: adminRow } = await serviceClient
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allUsers: any[] = [];
  let pg = 1;
  while (true) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page: pg,
      perPage: 1000,
    });

    if (error) {
      console.error("[admin/clients] listUsers error:", error.message);
      break;
    }
    const batch = data?.users ?? [];
    if (!batch.length) break;

    allUsers.push(...batch);
    if (batch.length < 1000) break;
    pg++;
  }

  // Read role from both fields to handle either SDK response shape
  const getRole = (u: any): string =>
    u.user_metadata?.role ?? (u as any).raw_user_meta_data?.role ?? "";

  const clientUsers = allUsers.filter((u) => getRole(u) === "client");

  if (clientUsers.length === 0) return NextResponse.json({ clients: [] });

  const clientIds = clientUsers.map((c) => c.id);

  const [{ data: bookingRows }, { data: deletionRows }] = await Promise.all([
    serviceClient.from("bookings").select("client_id").in("client_id", clientIds),
    serviceClient
      .from("account_deletion_requests")
      .select("user_id, scheduled_deletion_at")
      .in("user_id", clientIds)
      .eq("status", "pending"),
  ]);

  const bookingCounts: Record<string, number> = {};
  for (const b of bookingRows || []) {
    bookingCounts[b.client_id] = (bookingCounts[b.client_id] || 0) + 1;
  }

  const deletionMap: Record<string, string> = {};
  for (const d of deletionRows || []) {
    deletionMap[d.user_id] = d.scheduled_deletion_at;
  }

  // Read name from both field locations too
  const getName = (u: any): string =>
    u.user_metadata?.name ?? (u as any).raw_user_meta_data?.name ?? "";

  const result = clientUsers
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name: getName(u),
      created_at: u.created_at,
      booking_count: bookingCounts[u.id] ?? 0,
      pending_deletion: !!deletionMap[u.id],
      scheduled_deletion_at: deletionMap[u.id] ?? null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ clients: result });
}
