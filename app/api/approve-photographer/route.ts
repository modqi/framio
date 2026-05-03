import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Verify the caller is an authenticated admin
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user: caller } } = await anonClient.auth.getUser(token);
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: adminRow } = await serviceClient
    .from("admin_users")
    .select("email")
    .eq("email", caller.email)
    .single();
  if (!adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { email, name, location, specialty } = await request.json();
    let found: any = null;
    let page = 1;
    while (!found) {
      const { data: batch } = await serviceClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (!batch?.users?.length) break;
      found = batch.users.find((u: any) => u.email === email) ?? null;
      if (batch.users.length < 1000) break;
      page++;
    }
    if (!found) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = found;
    await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: { role: "photographer", name },
    });
    await serviceClient.from("photographers").upsert({
      user_id: user.id,
      name,
      email: email,
      location: location || "",
      specialty: specialty || "",
      price: "Price on request",
    }, { onConflict: "user_id" });
    // Invalidate existing sessions so the photographer's next login issues a
    // fresh JWT containing role: "photographer" rather than "pending_photographer".
    await serviceClient.auth.admin.signOut(user.id, "global");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}