import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

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

  const body = await request.json();
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const { data: booking } = await serviceClient
    .from("bookings")
    .select("id, client_id, photographer_id, photographer_name, photographer_email, client_name, session_type, date, stripe_payment_intent_id, status")
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.client_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== "photos_delivered") {
    return NextResponse.json({ error: "Booking is not in photos_delivered status" }, { status: 400 });
  }
  if (!booking.stripe_payment_intent_id) {
    return NextResponse.json({ error: "No payment intent on booking" }, { status: 400 });
  }

  // Optimistic lock — prevents double-payout if cron fires at the same time
  const { count } = await serviceClient
    .from("bookings")
    .update({ status: "releasing" }, { count: "exact" })
    .eq("id", bookingId)
    .eq("status", "photos_delivered");

  if (!count || count === 0) {
    return NextResponse.json({ error: "Payment is already being released" }, { status: 409 });
  }

  try {
    const { data: photographerRow } = await serviceClient
      .from("photographers")
      .select("stripe_account_id")
      .eq("user_id", booking.photographer_id)
      .single();

    if (!photographerRow?.stripe_account_id) {
      await serviceClient.from("bookings").update({ status: "photos_delivered" }).eq("id", bookingId);
      return NextResponse.json({ error: "Photographer has no Stripe account" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
    const amount = paymentIntent.amount;
    const currency = paymentIntent.currency;
    const netAmount = amount - Math.round(amount * 0.10);

    const transfer = await stripe.transfers.create({
      amount: netAmount,
      currency,
      destination: photographerRow.stripe_account_id,
      transfer_group: bookingId,
      source_transaction: paymentIntent.latest_charge as string,
    });

    await serviceClient
      .from("bookings")
      .update({
        status: "paid_out",
        payout_released_at: new Date().toISOString(),
        stripe_transfer_id: transfer.id,
      })
      .eq("id", bookingId);

    await logAudit(serviceClient, {
      action: "client_approved_delivery",
      actorId: user.id,
      actorEmail: user.email,
      bookingId,
      stripeId: transfer.id,
      amountCents: netAmount,
      currency,
    });

    resend.emails.send({
      from: "Lomissa <hello@lomissa.com>",
      to: booking.photographer_email,
      subject: `${esc(booking.client_name)} approved your delivery — payment released`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
            <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
          </div>
          <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">PAYMENT RELEASED</p>
            <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">
              Your client approved the delivery
            </h2>
            <p style="font-size: 14px; color: #555; margin: 0 0 16px; line-height: 1.7;">
              Hi ${esc(booking.photographer_name)}, <strong>${esc(booking.client_name)}</strong> has approved your photo delivery for the
              <strong>${esc(booking.session_type)}</strong> session on ${esc(booking.date)}.
            </p>
            <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">
              Your payment has been released immediately — no need to wait for the 7-day window.
            </p>
          </div>
          <div style="text-align: center; margin-top: 32px;">
            <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
          </div>
        </div>
      `,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Roll back so client can retry or cron can pick it up
    await serviceClient.from("bookings").update({ status: "photos_delivered" }).eq("id", bookingId);
    console.error("[approve-delivery] error:", err?.message);
    return NextResponse.json({ error: err?.message || "Failed to release payment" }, { status: 500 });
  }
}
