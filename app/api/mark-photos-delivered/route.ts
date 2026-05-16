import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

const resend = new Resend(process.env.RESEND_API_KEY!);

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

  const { bookingId } = await request.json();

  const { data: booking } = await serviceClient
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("photographer_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Booking must be in completed status" }, { status: 400 });
  }

  const payoutDueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await serviceClient
    .from("bookings")
    .update({
      status: "photos_delivered",
      photos_delivered_at: new Date().toISOString(),
      payout_due_at: payoutDueAt,
    })
    .eq("id", bookingId);

  if (error) {
    console.error("mark-photos-delivered update error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }

  await logAudit(serviceClient, {
    action: "photos_delivered",
    actorId: user.id,
    bookingId,
    meta: { payout_due_at: payoutDueAt },
  });

  if (booking.client_email) {
    resend.emails.send({
      from: "Lomissa <noreply@lomissa.com>",
      to: booking.client_email,
      subject: "Your photos are ready to review",
      html: `<p>Hi ${esc(booking.client_name)},</p><p>${esc(booking.photographer_name)} has delivered your photos from your ${esc(booking.session_type)} session on ${esc(booking.date)}.</p><p>You have <strong>7 days</strong> to review them and raise a dispute if needed. If no dispute is raised, payment will be automatically released to your photographer.</p><p>Log in to your <a href="${esc(process.env.NEXT_PUBLIC_BASE_URL ?? "")}/dashboard">Lomissa dashboard</a> to raise a dispute if needed.</p>`,
    }).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
