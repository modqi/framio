import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("[admin/clients] route reached");

  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    console.log("[admin/clients] no token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (!user) {
    console.log("[admin/clients] auth failed:", authError?.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[admin/clients] caller:", user.email);

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[admin/clients] service role key present:", !!serviceRoleKey, "length:", serviceRoleKey?.length ?? 0);

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey!
  );

  const { data: adminRow } = await serviceClient
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .single();
  if (!adminRow) {
    console.log("[admin/clients] caller is not admin:", user.email);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers: any[] = [];
  let pg = 1;
  while (true) {
    console.log("[admin/clients] calling listUsers page", pg);
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page: pg,
      perPage: 1000,
    });
    console.log("[admin/clients] listUsers result — error:", error?.message ?? null, "users:", data?.users?.length ?? 0, "total:", (data as any)?.total ?? "n/a");

    if (error) {
      console.error("[admin/clients] listUsers error:", error.message, error);
      break;
    }
    const batch = data?.users ?? [];
    if (!batch.length) break;

    // Log full field inventory of first user so we can identify the correct metadata key
    const sample = batch[0];
    console.log("[admin/clients] sample user keys:", Object.keys(sample));
    console.log("[admin/clients] sample user — email:", sample.email);
    console.log("[admin/clients] sample user_metadata:", JSON.stringify(sample.user_metadata));
    console.log("[admin/clients] sample raw_user_meta_data:", JSON.stringify((sample as any).raw_user_meta_data));
    console.log("[admin/clients] sample app_metadata:", JSON.stringify(sample.app_metadata));

    allUsers.push(...batch);
    if (batch.length < 1000) break;
    pg++;
  }

  console.log("[admin/clients] total users fetched:", allUsers.length);

  // Check role from both possible field locations
  const rolesFromUserMetadata = [...new Set(allUsers.map((u) => u.user_metadata?.role ?? "(none)"))];
  const rolesFromRawMeta = [...new Set(allUsers.map((u) => (u as any).raw_user_meta_data?.role ?? "(none)"))];
  console.log("[admin/clients] roles via user_metadata:", rolesFromUserMetadata);
  console.log("[admin/clients] roles via raw_user_meta_data:", rolesFromRawMeta);

  const { data: adminRows } = await serviceClient.from("admin_users").select("email");
  const adminEmails = new Set((adminRows || []).map((a: any) => a.email));

  // Read role from both fields to handle either SDK response shape
  const getRole = (u: any): string =>
    u.user_metadata?.role ?? (u as any).raw_user_meta_data?.role ?? "";

  const clientUsers = allUsers.filter(
    (u) => getRole(u) === "client" && !adminEmails.has(u.email)
  );
  console.log("[admin/clients] users with role=client:", clientUsers.length);

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

  console.log("[admin/clients] returning", result.length, "clients");
  return NextResponse.json({ clients: result });
}
