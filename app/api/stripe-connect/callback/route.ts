import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function verifyStateToken(
  token: string,
  expectedAccountId: string
): { valid: boolean; userId?: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [payload, providedHmac] = parts;

  const expectedHmac = crypto
    .createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(payload)
    .digest("base64url");

  let hmacMatch = false;
  try {
    hmacMatch = crypto.timingSafeEqual(
      Buffer.from(providedHmac, "base64url"),
      Buffer.from(expectedHmac, "base64url")
    );
  } catch {
    return { valid: false };
  }
  if (!hmacMatch) return { valid: false };

  const decoded = Buffer.from(payload, "base64url").toString();
  const parts2 = decoded.split(":");
  if (parts2.length !== 3) return { valid: false };
  const [userId, accountId, expiryStr] = parts2;

  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Math.floor(Date.now() / 1000) > expiry) return { valid: false };
  if (accountId !== expectedAccountId) return { valid: false };

  return { valid: true, userId };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account");
  const state = searchParams.get("state");
  const base = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!accountId || !state) {
    return NextResponse.redirect(`${base}/photographer-dashboard`);
  }

  const { valid, userId } = verifyStateToken(state, accountId);
  if (!valid || !userId) {
    return NextResponse.redirect(`${base}/photographer-dashboard`);
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: photographer } = await serviceClient
      .from("photographers")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .single();

    if (!photographer || photographer.stripe_account_id !== accountId) {
      return NextResponse.redirect(`${base}/photographer-dashboard`);
    }

    const account = await stripe.accounts.retrieve(accountId);

    if (account.details_submitted) {
      await serviceClient
        .from("photographers")
        .update({ stripe_onboarding_completed: true })
        .eq("user_id", userId);
      return NextResponse.redirect(`${base}/photographer-dashboard/payout-setup-complete`);
    }

    return NextResponse.redirect(`${base}/photographer-dashboard?connect=incomplete`);
  } catch (error) {
    console.error("Connect callback error:", error);
    return NextResponse.redirect(`${base}/photographer-dashboard?connect=error`);
  }
}
