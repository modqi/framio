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
  if (user.user_metadata?.role !== "photographer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();

    const payload: Record<string, any> = {
      name: body.name || null,
      bio: body.bio || null,
      specialty: body.specialty || null,
      specialities: body.specialities ?? [],
      location: body.location || null,
      instagram: body.instagram || null,
      website: body.website || null,
      phone_number: body.phone_number || null,
      cancellation_policy: body.cancellation_policy || "moderate",
      delivery_time: body.delivery_time || null,
      copyright_ownership: body.copyright_ownership || null,
      editing_style: body.editing_style || null,
      revisions_included: body.revisions_included || null,
      profile_photo: body.profile_photo || null,
    };

    const { error } = await serviceClient
      .from("photographers")
      .update(payload)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to update profile" }, { status: 500 });
  }
}
