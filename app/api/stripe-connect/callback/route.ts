import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account");
  const userId = searchParams.get("userId");
  const base = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!accountId || !userId) {
    return NextResponse.redirect(`${base}/photographer-dashboard`);
  }

  try {
    // Verify the account ID in the URL matches what's stored for this user —
    // prevents someone constructing a URL to mark a different photographer complete.
    const { data: photographer } = await serviceClient
      .from("photographers")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .single();

    if (!photographer || photographer.stripe_account_id !== accountId) {
      return NextResponse.redirect(`${base}/photographer-dashboard`);
    }

    const account = await stripe.accounts.retrieve(accountId);

    if (account.charges_enabled) {
      await serviceClient
        .from("photographers")
        .update({ stripe_onboarding_completed: true })
        .eq("user_id", userId);
      return NextResponse.redirect(`${base}/photographer-dashboard/payout-setup-complete`);
    }

    // Onboarding started but not fully verified yet (e.g. docs pending review)
    return NextResponse.redirect(`${base}/photographer-dashboard?connect=incomplete`);
  } catch (error) {
    console.error("Connect callback error:", error);
    return NextResponse.redirect(`${base}/photographer-dashboard`);
  }
}
