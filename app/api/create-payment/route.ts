import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      photographerName,
      sessionType,
      price,
      date,
      location,
      photographerId,
      clientId,
    } = body;

    const priceInOre = Math.round(parseFloat(price.replace(/[^0-9.]/g, "")) * 100);

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
        photographerId,
        clientId,
        sessionType,
        date,
        location,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}