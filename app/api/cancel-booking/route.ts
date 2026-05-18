import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
  if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });

  const { data: booking } = await serviceClient
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const isClient = booking.client_id === user.id;
  const isPhotographer = booking.photographer_id === user.id;
  if (!isClient && !isPhotographer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!["pending", "confirmed"].includes(booking.status)) {
    return NextResponse.json({ error: "Booking cannot be cancelled" }, { status: 400 });
  }

  // Photographers can only cancel confirmed bookings (pending → use Decline instead)
  if (isPhotographer && booking.status === "pending") {
    return NextResponse.json({ error: "Use decline for pending bookings" }, { status: 400 });
  }

  // Determine refund eligibility
  let shouldRefund = false;

  if (isClient && booking.status === "pending") {
    shouldRefund = true;
  } else if (isClient && booking.status === "confirmed") {
    if (!booking.date) {
      shouldRefund = true;
    } else {
      const policy = booking.cancellation_policy_snapshot || "moderate";
      if (policy === "flexible") {
        const sessionDate = new Date(booking.date + "T00:00:00");
        const hoursUntil = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);
        shouldRefund = hoursUntil > 24;
      } else if (policy === "moderate") {
        const sessionDate = new Date(booking.date + "T00:00:00");
        const hoursUntil = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);
        shouldRefund = hoursUntil > 48;
      } else {
        // strict — no refund
        shouldRefund = false;
      }
    }
  } else if (isPhotographer && booking.status === "confirmed") {
    shouldRefund = true;
  }

  // Issue Stripe refund
  let refunded = false;
  if (shouldRefund) {
    if (booking.stripe_payment_intent_id) {
      try {
        await stripe.refunds.create(
          { payment_intent: booking.stripe_payment_intent_id },
          { idempotencyKey: `refund-${bookingId}` }
        );
        refunded = true;
      } catch (err: any) {
        console.error("[cancel-booking] Stripe refund failed:", err?.message);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
      }
    } else {
      console.error("[cancel-booking] Refund due but no stripe_payment_intent_id on booking", bookingId);
      // Still cancel the booking — manual refund will be needed
    }
  }

  const { error: updateError } = await serviceClient
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (updateError) {
    console.error("[cancel-booking] DB update failed:", updateError);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }

  const cancelledBy = isClient ? "client" : "photographer";

  await logAudit(serviceClient, {
    action: "booking_cancelled",
    actorId: user.id,
    actorEmail: user.email,
    bookingId,
    stripeId: booking.stripe_payment_intent_id ?? null,
    meta: { cancelled_by: cancelledBy, refunded, policy: booking.cancellation_policy_snapshot },
  });

  const refundLine = refunded
    ? "A full refund has been issued and will appear in 5–10 business days."
    : shouldRefund
    ? "A refund was due but could not be processed automatically — please contact hello@lomissa.com."
    : "No refund was issued per the cancellation policy.";

  await resend.emails.send({
    from: "Lomissa <hello@lomissa.com>",
    to: booking.client_email,
    subject: "Your booking has been cancelled",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
          <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">BOOKING CANCELLED</p>
          <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">
            Your booking with ${esc(booking.photographer_name)} has been cancelled
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.session_type)}</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.date || "Not set")}</span>
              </td>
            </tr>
          </table>
          <p style="font-size: 14px; color: #555; margin: 0 0 12px; line-height: 1.7;">
            This booking was cancelled by the ${cancelledBy === "client" ? "client" : "photographer"}.
          </p>
          <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">${refundLine}</p>
        </div>
        <div style="text-align: center;">
          <a href="https://lomissa.com/photographers" style="background: #1a1a1a; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; display: inline-block;">
            Find another photographer
          </a>
        </div>
        <div style="text-align: center; margin-top: 32px;">
          <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
        </div>
      </div>
    `,
  });

  await resend.emails.send({
    from: "Lomissa <hello@lomissa.com>",
    to: booking.photographer_email,
    subject: "A booking has been cancelled",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
          <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">BOOKING CANCELLED</p>
          <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">
            Booking with ${esc(booking.client_name)} has been cancelled
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.session_type)}</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.date || "Not set")}</span>
              </td>
            </tr>
          </table>
          <p style="font-size: 14px; color: #555; margin: 0 0 12px; line-height: 1.7;">
            This booking was cancelled by the ${cancelledBy === "photographer" ? "photographer (you)" : "client"}.
          </p>
          ${refunded ? `<p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">The client has been issued a full refund.</p>` : ""}
        </div>
        <div style="text-align: center; margin-top: 32px;">
          <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ cancelled: true, refunded });
}
