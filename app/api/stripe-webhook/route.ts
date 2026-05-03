import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return NextResponse.json({ received: true });

    // Flip status so the booking becomes visible to both parties
    const { data: booking } = await serviceClient
      .from("bookings")
      .update({ status: "pending" })
      .eq("id", bookingId)
      .eq("status", "awaiting_payment")
      .select("*")
      .single();

    if (!booking) return NextResponse.json({ received: true });

    // Send booking notification email
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "booking_request",
        photographerName: booking.photographer_name,
        photographerEmail: booking.photographer_email,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        sessionType: booking.session_type,
        date: booking.date,
        location: booking.location,
        message: booking.message,
        price: booking.price,
      }),
    });
  }

  return NextResponse.json({ received: true });
}
