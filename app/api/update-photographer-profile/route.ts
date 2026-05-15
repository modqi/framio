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

  // Verify the photographer row exists in the DB — JWT metadata can be stale
  const { data: photographerRow } = await serviceClient
    .from("photographers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!photographerRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();

    const str = (v: unknown, max: number): string | null => {
      const s = typeof v === "string" ? v.slice(0, max).trim() : "";
      return s || null;
    };

    const ALLOWED_POLICIES = ["flexible", "moderate", "strict"];
    const policy = ALLOWED_POLICIES.includes(body.cancellation_policy) ? body.cancellation_policy : "moderate";

    const payload: Record<string, any> = {
      name: str(body.name, 100),
      bio: str(body.bio, 2000),
      specialty: str(body.specialty, 100),
      specialities: Array.isArray(body.specialities) ? body.specialities.slice(0, 20) : [],
      location: str(body.location, 200),
      instagram: str(body.instagram, 100),
      website: str(body.website, 300),
      phone_number: str(body.phone_number, 30),
      cancellation_policy: policy,
      delivery_time: str(body.delivery_time, 200),
      copyright_ownership: str(body.copyright_ownership, 200),
      editing_style: str(body.editing_style, 200),
      revisions_included: str(body.revisions_included, 200),
      profile_photo: str(body.profile_photo, 500),
      other_specialty: (body.specialities ?? []).includes("Other")
        ? str(body.other_specialty, 100)
        : null,
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
