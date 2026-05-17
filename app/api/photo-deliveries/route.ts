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

  const bookingId = request.nextUrl.searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json({ error: "bookingId is required" }, { status: 400 });

  // Verify the caller is a party to this booking
  const { data: booking } = await serviceClient
    .from("bookings")
    .select("id, client_id, photographer_id")
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.client_id !== user.id && booking.photographer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: deliveryRows } = await serviceClient
    .from("photo_deliveries")
    .select("id, message, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (!deliveryRows?.length) {
    return NextResponse.json({ deliveries: [] });
  }

  const deliveryIds = deliveryRows.map((d: any) => d.id);

  const { data: photoRows } = await serviceClient
    .from("delivered_photos")
    .select("id, delivery_id, cloudinary_url, storage_path, filename")
    .in("delivery_id", deliveryIds)
    .order("created_at", { ascending: true });

  const photosByDelivery: Record<string, any[]> = {};
  for (const p of photoRows || []) {
    if (!photosByDelivery[p.delivery_id]) photosByDelivery[p.delivery_id] = [];
    photosByDelivery[p.delivery_id].push(p);
  }

  const deliveries = deliveryRows.map((d: any) => ({
    ...d,
    photos: photosByDelivery[d.id] || [],
  }));

  return NextResponse.json({ deliveries });
}
