import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await serviceClient
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch all auth users (paginate in case of large user base)
  const allUsers: any[] = [];
  let pg = 1;
  while (true) {
    const { data: { users }, error } = await serviceClient.auth.admin.listUsers({ page: pg, perPage: 1000 });
    if (error || !users?.length) break;
    allUsers.push(...users);
    if (users.length < 1000) break;
    pg++;
  }

  // Exclude photographers and admin accounts
  const { data: adminRows } = await serviceClient.from("admin_users").select("email");
  const adminEmails = new Set((adminRows || []).map((a: any) => a.email));

  const clients = allUsers.filter(
    (u) => u.user_metadata?.role !== "photographer" && !adminEmails.has(u.email)
  );

  if (clients.length === 0) return NextResponse.json({ clients: [] });

  const clientIds = clients.map((c) => c.id);

  // Booking counts per client — fetch in one query
  const { data: bookingRows } = await serviceClient
    .from("bookings")
    .select("client_id")
    .in("client_id", clientIds);

  const bookingCounts: Record<string, number> = {};
  for (const b of bookingRows || []) {
    bookingCounts[b.client_id] = (bookingCounts[b.client_id] || 0) + 1;
  }

  // Pending deletion requests for these clients
  const { data: deletionRows } = await serviceClient
    .from("account_deletion_requests")
    .select("user_id, scheduled_deletion_at")
    .in("user_id", clientIds)
    .eq("status", "pending");

  const deletionMap: Record<string, string> = {};
  for (const d of deletionRows || []) {
    deletionMap[d.user_id] = d.scheduled_deletion_at;
  }

  const result = clients
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name: u.user_metadata?.name ?? "",
      created_at: u.created_at,
      booking_count: bookingCounts[u.id] ?? 0,
      pending_deletion: !!deletionMap[u.id],
      scheduled_deletion_at: deletionMap[u.id] ?? null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ clients: result });
}
