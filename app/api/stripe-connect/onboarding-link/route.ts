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

  try {
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user || user.user_metadata?.role !== "photographer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: photographer } = await serviceClient
      .from("photographers")
      .select("stripe_account_id, stripe_onboarding_completed, email, name")
      .eq("user_id", user.id)
      .single();

    if (!photographer) {
      return NextResponse.json({ error: "Photographer record not found" }, { status: 404 });
    }

    if (photographer.stripe_onboarding_completed) {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }

    let accountId = photographer.stripe_account_id;

    // Create the Express account if it wasn't saved during approval
    // (handles cases where approval-time account creation failed silently)
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: photographer.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { user_id: user.id },
      });
      accountId = account.id;
      await serviceClient
        .from("photographers")
        .update({ stripe_account_id: accountId })
        .eq("user_id", user.id);
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/photographer-dashboard`,
      return_url: `${base}/api/stripe-connect/callback?account=${accountId}&userId=${user.id}`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Onboarding link error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to generate onboarding link" },
      { status: 500 }
    );
  }
}
