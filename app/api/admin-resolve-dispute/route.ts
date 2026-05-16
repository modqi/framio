import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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

  const { data: adminData } = await serviceClient
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .single();
  if (!adminData) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
  const action = typeof body.action === "string" ? body.action : "";
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.slice(0, 1000) : null;
  if (!["release", "refund"].includes(action)) {
    return NextResponse.json({ error: "action must be release or refund" }, { status: 400 });
  }

  const { data: booking } = await serviceClient
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("status", "disputed")
    .single();

  if (!booking) return NextResponse.json({ error: "Disputed booking not found" }, { status: 404 });
  if (!booking.stripe_payment_intent_id) {
    return NextResponse.json({ error: "No payment intent on booking" }, { status: 400 });
  }

  try {
    if (action === "release") {
      const { data: photographerRow } = await serviceClient
        .from("photographers")
        .select("stripe_account_id")
        .eq("user_id", booking.photographer_id)
        .single();

      if (!photographerRow?.stripe_account_id) {
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
          admin_note: adminNote || null,
        })
        .eq("id", bookingId);

      await logAudit(serviceClient, {
        action: "dispute_resolved_release",
        actorId: user.id,
        actorEmail: user.email,
        bookingId,
        stripeId: transfer.id,
        amountCents: netAmount,
        currency,
        meta: { admin_note: adminNote },
      });

      if (booking.photographer_email) {
        resend.emails.send({
          from: "Lomissa <noreply@lomissa.com>",
          to: booking.photographer_email,
          subject: "Dispute resolved — payment released",
          html: `<p>Hi ${esc(booking.photographer_name)}, the dispute for your ${esc(booking.session_type)} session with ${esc(booking.client_name)} on ${esc(booking.date)} has been resolved in your favour. Your payment has been released.</p>`,
        }).catch(console.error);
      }

    } else {
      await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });

      await serviceClient
        .from("bookings")
        .update({
          status: "cancelled",
          admin_note: adminNote || null,
        })
        .eq("id", bookingId);

      await logAudit(serviceClient, {
        action: "dispute_resolved_refund",
        actorId: user.id,
        actorEmail: user.email,
        bookingId,
        stripeId: booking.stripe_payment_intent_id,
        meta: { admin_note: adminNote },
      });

      if (booking.client_email) {
        resend.emails.send({
          from: "Lomissa <noreply@lomissa.com>",
          to: booking.client_email,
          subject: "Dispute resolved — refund issued",
          html: `<p>Hi ${esc(booking.client_name)}, your dispute for the ${esc(booking.session_type)} session with ${esc(booking.photographer_name)} on ${esc(booking.date)} has been resolved. A full refund has been issued to your original payment method.</p>`,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin-resolve-dispute] error:", err?.message);
    return NextResponse.json({ error: err?.message || "Failed to resolve dispute" }, { status: 500 });
  }
}
