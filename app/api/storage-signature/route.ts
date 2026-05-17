import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { extname } from "path";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  const { bookingId, filename, contentType } = await request.json();
  if (!bookingId || !filename) {
    return NextResponse.json({ error: "bookingId and filename are required" }, { status: 400 });
  }

  const { data: booking } = await serviceClient
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .eq("photographer_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!["confirmed", "completed", "photos_delivered"].includes(booking.status)) {
    return NextResponse.json({ error: "Booking not eligible for delivery" }, { status: 400 });
  }

  // Derive extension from filename, fall back to contentType
  let ext = extname(filename).toLowerCase();
  if (!ext && contentType) {
    const map: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    ext = map[contentType] ?? "";
  }

  const uniquePath = `${bookingId}/${crypto.randomUUID()}${ext}`;

  const { data, error } = await serviceClient.storage
    .from("deliveries")
    .createSignedUploadUrl(uniquePath);

  if (error || !data) {
    console.error("[storage-signature] createSignedUploadUrl error:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path });
}
