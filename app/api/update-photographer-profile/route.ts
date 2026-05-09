import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    console.error("[update-photographer-profile] Auth error:", authError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[update-photographer-profile] user:", user.id, "role:", user.user_metadata?.role);

  if (user.user_metadata?.role !== "photographer") {
    return NextResponse.json({ error: "Forbidden: role is not photographer" }, { status: 403 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    console.log("[update-photographer-profile] payload keys:", Object.keys(body));

    const payload: Record<string, any> = {
      name: body.name || null,
      bio: body.bio || null,
      specialty: body.specialty || null,
      specialities: body.specialities ?? [],
      location: body.location || null,
      instagram: body.instagram || null,
      website: body.website || null,
      cancellation_policy: body.cancellation_policy || "moderate",
      delivery_time: body.delivery_time || null,
      copyright_ownership: body.copyright_ownership || null,
      editing_style: body.editing_style || null,
      revisions_included: body.revisions_included || null,
      profile_photo: body.profile_photo || null,
    };

    console.log("[update-photographer-profile] updating user_id:", user.id);

    const { data, error, count } = await serviceClient
      .from("photographers")
      .update(payload)
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      console.error("[update-photographer-profile] DB error:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log("[update-photographer-profile] updated rows:", data?.length ?? 0, "data:", JSON.stringify(data));

    if (!data || data.length === 0) {
      console.error("[update-photographer-profile] No row found for user_id:", user.id);
      return NextResponse.json({ error: `No photographer row found for user_id ${user.id}` }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[update-photographer-profile] Unexpected error:", err?.message, err?.stack);
    return NextResponse.json({ error: err?.message ?? "Failed to update profile" }, { status: 500 });
  }
}
