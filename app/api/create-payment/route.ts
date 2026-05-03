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

    const priceInOre = Math.round(parseFloat(price.replace(/[^0-9.]/g, "")) * 100);
    const isPriceOnRequest = isNaN(priceInOre) || priceInOre <= 0;

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

    // Priced session: create Stripe checkout, webhook will flip status + send email
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "nok",
            product_data: {
              name: `Photography session with ${photographerName}`,
              description: `${sessionType} — ${date} — ${location}`,
            },
            unit_amount: priceInOre,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
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
