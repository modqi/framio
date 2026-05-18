import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function generateStateToken(userId: string, accountId: string): string {
  const expiry = Math.floor(Date.now() / 1000) + 15 * 60;
  const payload = Buffer.from(`${userId}:${accountId}:${expiry}`).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(payload)
    .digest("base64url");
  return `${payload}.${hmac}`;
}

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

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    const state = generateStateToken(user.id, accountId);
    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/photographer-dashboard`,
      return_url: `${base}/api/stripe-connect/callback?account=${accountId}&state=${encodeURIComponent(state)}`,
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
