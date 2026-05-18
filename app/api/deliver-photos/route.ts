import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId, message, photos } = await request.json();
  // photos: Array<{ storagePath?: string; url?: string; filename: string; public_id?: string }>

  if (!bookingId || !Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json({ error: "bookingId and at least one photo are required" }, { status: 400 });
  }
  if (photos.length > 100) {
    return NextResponse.json({ error: "Maximum 100 photos per delivery" }, { status: 400 });
  }

  for (const photo of photos) {
    if (photo.url && !String(photo.url).startsWith("https://res.cloudinary.com/")) {
      return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
    }
  }

  const { data: booking } = await serviceClient
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("photographer_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!["confirmed", "completed", "photos_delivered"].includes(booking.status)) {
    return NextResponse.json({ error: "Booking not eligible for delivery" }, { status: 400 });
  }

  // Create the delivery record
  const { data: delivery, error: deliveryError } = await serviceClient
    .from("photo_deliveries")
    .insert({
      booking_id: bookingId,
      photographer_id: user.id,
      client_id: booking.client_id,
      message: message?.trim() || null,
    })
    .select("id")
    .single();

  if (deliveryError || !delivery) {
    console.error("[deliver-photos] delivery insert error:", deliveryError);
    return NextResponse.json({ error: "Failed to create delivery" }, { status: 500 });
  }

  // Insert individual photo records
  const { error: photosError } = await serviceClient
    .from("delivered_photos")
    .insert(
      photos.map((p: { storagePath?: string; url?: string; filename: string; public_id?: string }) => ({
        delivery_id: delivery.id,
        storage_path: p.storagePath ?? null,
        cloudinary_url: p.url ?? null,
        filename: p.filename || null,
        cloudinary_public_id: p.public_id ?? null,
      }))
    );

  if (photosError) {
    console.error("[deliver-photos] photos insert error", {
      code: photosError.code,
      message: photosError.message,
      details: photosError.details,
      hint: photosError.hint,
    });
    // Delivery record created but photos failed — clean up
    await serviceClient.from("photo_deliveries").delete().eq("id", delivery.id);
    return NextResponse.json({ error: "Failed to save photos" }, { status: 500 });
  }

  // Transition booking status if this is the first delivery (confirmed or completed)
  if (booking.status === "confirmed" || booking.status === "completed") {
    const payoutDueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await serviceClient
      .from("bookings")
      .update({
        status: "photos_delivered",
        photos_delivered_at: new Date().toISOString(),
        payout_due_at: payoutDueAt,
      })
      .eq("id", bookingId);
  }

  // Send "Your photos are ready!" email to client
  const galleryUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/deliveries/${bookingId}`;
  if (booking.client_email) {
    resend.emails.send({
      from: "Lomissa <hello@lomissa.com>",
      to: booking.client_email,
      subject: `Your photos are ready! — ${esc(booking.photographer_name)}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
            <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
          </div>
          <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">PHOTOS DELIVERED</p>
            <h2 style="font-family: Georgia, serif; font-size: 26px; color: #1a1a1a; margin: 0 0 16px;">
              Your photos are ready, ${esc(booking.client_name)}!
            </h2>
            <p style="font-size: 14px; color: #555; line-height: 1.7; margin: 0 0 20px;">
              ${esc(booking.photographer_name)} has delivered <strong>${photos.length} photo${photos.length === 1 ? "" : "s"}</strong>
              from your <em>${esc(booking.session_type)}</em> session on ${esc(booking.date)}.
            </p>
            ${message?.trim() ? `
            <div style="background: #FDF8F5; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #f0e8e0;">
              <p style="font-size: 11px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">MESSAGE FROM ${esc(booking.photographer_name).toUpperCase()}</p>
              <p style="font-size: 14px; color: #555; margin: 0; font-style: italic; line-height: 1.7;">"${esc(message.trim())}"</p>
            </div>
            ` : ""}
            <p style="font-size: 13px; color: #888; margin: 0 0 4px; line-height: 1.6;">
              You have <strong>7 days</strong> to review them and raise a dispute if needed. If no dispute is raised, payment is automatically released to your photographer.
            </p>
          </div>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${galleryUrl}" style="background: #1a1a1a; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              View &amp; download photos
            </a>
          </div>
          <div style="text-align: center;">
            <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
          </div>
        </div>
      `,
    }).catch(console.error);
  }

  return NextResponse.json({ success: true, deliveryId: delivery.id, photoCount: photos.length });
}
