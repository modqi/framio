import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Verify the caller is an authenticated user
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

    // Insert booking — server-side so it only exists after a verified auth check
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
        status: isPriceOnRequest ? "pending" : "awaiting_payment",
      })
      .select("id")
      .single();

    if (insertError || !booking) {
      console.error("Booking insert error:", insertError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // Price on request: no payment needed, caller sends email client-side
    if (isPriceOnRequest) {
      return NextResponse.json({ url: null });
    }

    // Look up the photographer's Connect account for payout routing + currency
    const { data: photographer } = await serviceClient
      .from("photographers")
      .select("stripe_account_id")
      .eq("user_id", photographerId)
      .single();

    if (!photographer?.stripe_account_id) {
      console.error("Photographer has no Stripe Connect account:", photographerId);
      return NextResponse.json({ error: "Photographer payment account not set up" }, { status: 400 });
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
        transfer_data: {
          destination: photographer.stripe_account_id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?booking=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/photographers`,
      metadata: {
        bookingId: booking.id,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
