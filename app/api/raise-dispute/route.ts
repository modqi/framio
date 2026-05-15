import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

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

  const { bookingId, reason: rawReason } = await request.json();
  const reason = typeof rawReason === "string" ? rawReason.slice(0, 2000) : "";

  const { data: booking } = await serviceClient
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "photos_delivered") {
    return NextResponse.json({ error: "Can only dispute after photos are delivered" }, { status: 400 });
  }
  if (booking.payout_due_at && new Date() > new Date(booking.payout_due_at)) {
    return NextResponse.json({ error: "Dispute window has closed" }, { status: 400 });
  }

  const { error } = await serviceClient
    .from("bookings")
    .update({
      status: "disputed",
      dispute_raised_at: new Date().toISOString(),
      dispute_reason: reason?.trim() || "No reason provided",
    })
    .eq("id", bookingId);

  if (error) {
    console.error("raise-dispute update error:", error);
    return NextResponse.json({ error: "Failed to raise dispute" }, { status: 500 });
  }

  const { data: admins } = await serviceClient.from("admin_users").select("email");
  const adminEmails = (admins || []).map((a: any) => a.email).filter(Boolean);

  if (adminEmails.length > 0) {
    resend.emails.send({
      from: "Lomissa <noreply@lomissa.com>",
      to: adminEmails,
      subject: `Dispute raised — ${booking.client_name} vs ${booking.photographer_name}`,
      html: `<p>A dispute has been raised on booking #${bookingId}.</p><p><strong>Client:</strong> ${booking.client_name} (${booking.client_email})</p><p><strong>Photographer:</strong> ${booking.photographer_name} (${booking.photographer_email})</p><p><strong>Session:</strong> ${booking.session_type} on ${booking.date} — ${booking.price}</p><p><strong>Reason:</strong> ${reason?.trim() || "No reason provided"}</p><p>Please resolve this dispute in the <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin">Lomissa admin panel</a>.</p>`,
    }).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
