import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const results = { confirmed_to_completed: 0, released: 0, errors: [] as string[] };

  // Transition confirmed → completed for sessions whose date has passed
  const { data: confirmedBookings } = await serviceClient
    .from("bookings")
    .select("id")
    .eq("status", "confirmed")
    .lt("date", today);

  if (confirmedBookings?.length) {
    const { error } = await serviceClient
      .from("bookings")
      .update({ status: "completed" })
      .in("id", confirmedBookings.map((b: any) => b.id));
    if (!error) results.confirmed_to_completed = confirmedBookings.length;
  }

  // Auto-release photos_delivered → paid_out when the 7-day dispute window has expired
  const { data: deliveredBookings } = await serviceClient
    .from("bookings")
    .select("id, stripe_payment_intent_id, photographer_id")
    .eq("status", "photos_delivered")
    .lt("payout_due_at", now.toISOString());

  for (const booking of deliveredBookings || []) {
    try {
      if (!booking.stripe_payment_intent_id) {
        results.errors.push(`Booking ${booking.id}: no payment intent`);
        continue;
      }

      const { data: photographerRow } = await serviceClient
        .from("photographers")
        .select("stripe_account_id")
        .eq("user_id", booking.photographer_id)
        .single();

      if (!photographerRow?.stripe_account_id) {
        results.errors.push(`Booking ${booking.id}: photographer has no Stripe account`);
        continue;
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
      const amount = paymentIntent.amount;
      const currency = paymentIntent.currency;
      const netAmount = amount - Math.round(amount * 0.10);

      const transfer = await stripe.transfers.create({
        amount: netAmount,
        currency,
        destination: photographerRow.stripe_account_id,
        transfer_group: booking.id,
        source_transaction: paymentIntent.latest_charge as string,
      });

      await serviceClient
        .from("bookings")
        .update({
          status: "paid_out",
          payout_released_at: now.toISOString(),
          stripe_transfer_id: transfer.id,
        })
        .eq("id", booking.id);

      results.released++;
    } catch (err: any) {
      results.errors.push(`Booking ${booking.id}: ${err?.message}`);
    }
  }

  console.log("[cron/release-payouts]", results);
  return NextResponse.json(results);
}
