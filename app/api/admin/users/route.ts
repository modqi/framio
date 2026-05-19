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
    console.error("[admin/users] auth failed:", authError?.message);
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
      console.error("[admin/users] listUsers error:", error.message);
      break;
    }
    const batch = data?.users ?? [];
    if (!batch.length) break;
    allUsers.push(...batch);
    if (batch.length < 1000) break;
    pg++;
  }

  const getRole = (u: any): string =>
    u.user_metadata?.role ?? (u as any).raw_user_meta_data?.role ?? "";

  const result = allUsers
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      role: getRole(u),
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned: (u as any).banned ?? false,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ users: result });
}
