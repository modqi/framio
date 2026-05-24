import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If the user already has a role, return it — never downgrade an existing role
  const existingRole = user.user_metadata?.role;
  if (existingRole) {
    return NextResponse.json({ role: existingRole });
  }

  // Assign client role via service role so the write cannot be forged by the user
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await serviceClient.auth.admin.updateUserById(user.id, {
    user_metadata: { role: "client" },
  });

  if (error) {
    console.error("[set-client-role] updateUserById error:", error.message);
    return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
  }

  return NextResponse.json({ role: "client" });
}
