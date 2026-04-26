import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, name, location, specialty } = await request.json();

    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find((u: any) => u.email === email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { role: "photographer", name },
    });

    await supabase.from("photographers").upsert({
      user_id: user.id,
      name,
      location: location || "",
      specialty: specialty || "",
      price: "Price on request",
    }, { onConflict: "user_id" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}