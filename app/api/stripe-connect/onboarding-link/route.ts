import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Called by the photographer dashboard "Complete setup" button to generate a
// fresh onboarding link when the original one has expired (24-hour TTL).
export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user || user.user_metadata?.role !== "photographer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photographer } = await serviceClient
    .from("photographers")
    .select("stripe_account_id, stripe_onboarding_completed")
    .eq("user_id", user.id)
    .single();

  if (!photographer?.stripe_account_id) {
    return NextResponse.json({ error: "No Stripe account found" }, { status: 404 });
  }
  if (photographer.stripe_onboarding_completed) {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const accountLink = await stripe.accountLinks.create({
    account: photographer.stripe_account_id,
    refresh_url: `${base}/photographer-dashboard`,
    return_url: `${base}/api/stripe-connect/callback?account=${photographer.stripe_account_id}&userId=${user.id}`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
