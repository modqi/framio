import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: photographer } = await serviceClient
    .from("photographers")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!photographer?.stripe_account_id) {
    return NextResponse.json({
      stripeAvailable: 0,
      stripePending: 0,
      currency: "usd",
      payouts: [],
      noStripeAccount: true,
    });
  }

  try {
    const opts = { stripeAccount: photographer.stripe_account_id };
    const [balance, payoutList] = await Promise.all([
      stripe.balance.retrieve({}, opts),
      stripe.payouts.list({ limit: 20 }, opts),
    ]);

    const stripeAvailable = balance.available.reduce((s, b) => s + b.amount, 0) / 100;
    const stripePending = balance.pending.reduce((s, b) => s + b.amount, 0) / 100;
    const currency = balance.available[0]?.currency ?? balance.pending[0]?.currency ?? "usd";

    return NextResponse.json({
      stripeAvailable,
      stripePending,
      currency,
      payouts: payoutList.data.map((p) => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency,
        arrival_date: p.arrival_date,
        status: p.status,
        description: p.description ?? null,
      })),
      noStripeAccount: false,
    });
  } catch (err: any) {
    console.error("[photographer-earnings] Stripe error:", err?.message);
    return NextResponse.json({ error: "stripe_error", message: err?.message }, { status: 500 });
  }
}
