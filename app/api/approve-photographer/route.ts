import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { logAudit } from "@/lib/audit";

function generateStateToken(userId: string, accountId: string): string {
  const expiry = Math.floor(Date.now() / 1000) + 30 * 60;
  const payload = Buffer.from(`${userId}:${accountId}:${expiry}`).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(payload)
    .digest("base64url");
  return `${payload}.${hmac}`;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Verify the caller is an authenticated admin
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user: caller } } = await anonClient.auth.getUser(token);
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: adminRow } = await serviceClient
    .from("admin_users")
    .select("email")
    .eq("email", caller.email)
    .single();
  if (!adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max).trim() : "");
    const email        = str(body.email, 254);
    const name         = str(body.name, 100);
    const location     = str(body.location, 200);
    const specialty    = str(body.specialty, 100);
    const phone_number = str(body.phone_number, 30);

    if (!email || !name) {
      return NextResponse.json({ error: "email and name are required" }, { status: 400 });
    }

    let found: any = null;
    let page = 1;
    while (!found) {
      const { data: batch } = await serviceClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (!batch?.users?.length) break;
      found = batch.users.find((u: any) => u.email === email) ?? null;
      if (batch.users.length < 1000) break;
      page++;
    }
    if (!found) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = found;

    // 1. Update role
    await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: { role: "photographer", name },
    });

    // 2. Invalidate existing sessions immediately after the role change.
    //    Runs before Stripe so it always fires even if Stripe fails, ensuring
    //    the old JWT (which may carry role: "client" or "pending_photographer")
    //    is never used after this point.
    await serviceClient.auth.admin.signOut(user.id, "global");

    // 3. Create/update the photographers row
    await serviceClient.from("photographers").upsert({
      user_id: user.id,
      name,
      email,
      location:  location  || "",
      specialty: specialty || "",
      price: "Price on request",
      ...(phone_number ? { phone_number } : {}),
    }, { onConflict: "user_id" });

    // 4. Reuse an existing Stripe Express account if a previous approval
    //    attempt already created one — prevents duplicate accounts on retry.
    const { data: existingRow } = await serviceClient
      .from("photographers")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    let stripeAccountId = existingRow?.stripe_account_id as string | null;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        metadata: { user_id: user.id },
      });
      stripeAccountId = account.id;

      await serviceClient
        .from("photographers")
        .update({ stripe_account_id: stripeAccountId })
        .eq("user_id", user.id);
    }

    // 5. Generate a fresh onboarding link (always — links are single-use / expire)
    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const state = generateStateToken(user.id, stripeAccountId);
    const accountLink = await stripe.accountLinks.create({
      account:     stripeAccountId,
      refresh_url: `${base}/photographer-dashboard`,
      return_url:  `${base}/api/stripe-connect/callback?account=${stripeAccountId}&state=${encodeURIComponent(state)}`,
      type: "account_onboarding",
    });

    await logAudit(serviceClient, {
      action:      "photographer_approved",
      actorId:     caller.id,
      actorEmail:  caller.email,
      bookingId:   null,
      stripeId:    stripeAccountId,
      meta: { photographer_user_id: user.id, photographer_email: email, photographer_name: name },
    });

    return NextResponse.json({ success: true, onboardingUrl: accountLink.url });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
