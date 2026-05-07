import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

  try {
    const {
      photographerName,
      photographerEmail,
      photographerId,
      sessionType,
      price,
      date,
      location,
      message,
    } = await request.json();

    const priceAmount = Math.round(parseFloat(price.replace(/[^0-9.]/g, "")) * 100);
    const isPriceOnRequest = isNaN(priceAmount) || priceAmount <= 0;

    // Reject before touching the DB — no booking row should exist without payment
    if (isPriceOnRequest) {
      return NextResponse.json({ error: "price_on_request" }, { status: 400 });
    }

    // Look up the photographer's Connect account before inserting the booking
    // so we don't create an orphaned awaiting_payment row if it's missing
    const { data: photographer } = await serviceClient
      .from("photographers")
      .select("stripe_account_id, cancellation_policy, photos_delivered, delivery_time, copyright_ownership, editing_style, revisions_included")
      .eq("user_id", photographerId)
      .single();

    if (!photographer?.stripe_account_id) {
      console.error("Photographer has no Stripe Connect account:", photographerId);
      return NextResponse.json({ error: "no_payment_account" }, { status: 400 });
    }

    // Insert booking — only after all pre-checks pass
    const { data: booking, error: insertError } = await serviceClient
      .from("bookings")
      .insert({
        client_id: user.id,
        client_name: user.user_metadata?.name || "",
        client_email: user.email,
        photographer_name: photographerName,
        photographer_id: photographerId,
        photographer_email: photographerEmail,
        session_type: sessionType,
        date,
        location,
        message,
        price,
        status: "awaiting_payment",
        cancellation_policy_snapshot: photographer.cancellation_policy || "moderate",
        terms_snapshot: {
          photos_delivered: photographer.photos_delivered || null,
          delivery_time: photographer.delivery_time || null,
          copyright_ownership: photographer.copyright_ownership || null,
          editing_style: photographer.editing_style || null,
          revisions_included: photographer.revisions_included || null,
        },
      })
      .select("id")
      .single();

    if (insertError || !booking) {
      console.error("Booking insert error:", insertError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // Use the photographer's Stripe account currency so the client is charged
    // in the correct local currency — Stripe Connect handles multi-currency.
    const stripeAccount = await stripe.accounts.retrieve(photographer.stripe_account_id);
    const currency = stripeAccount.default_currency || "usd";
    const feeAmount = Math.round(priceAmount * 0.10);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Photography session with ${photographerName}`,
              description: `${sessionType} — ${date} — ${location}`,
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: { destination: photographer.stripe_account_id },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?booking=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/photographers`,
      metadata: { bookingId: booking.id },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
