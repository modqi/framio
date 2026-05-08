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
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      photographerName,
      photographerEmail,
      photographerId,
      packageId,
      addons: selectedAddons, // [{id: string, quantity: number}]
      date,
      location,
      message,
    } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: "no_package_selected" }, { status: 400 });
    }

    // Look up the photographer before touching DB — bail early if no Connect account
    const { data: photographer } = await serviceClient
      .from("photographers")
      .select("id, stripe_account_id, cancellation_policy, delivery_time, copyright_ownership, editing_style, revisions_included")
      .eq("user_id", photographerId)
      .single();

    if (!photographer?.stripe_account_id) {
      return NextResponse.json({ error: "no_payment_account" }, { status: 400 });
    }

    // Fetch and verify the selected package belongs to this photographer
    const { data: pkg } = await serviceClient
      .from("photographer_packages")
      .select("*")
      .eq("id", packageId)
      .single();

    if (!pkg || pkg.photographer_id !== photographer.id) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // Fetch and verify add-ons — single batch query filtered to this photographer
    const resolvedAddons: Array<{id: string; name: string; price: number; unit: string; quantity: number}> = [];
    const requestedAddons = (selectedAddons || []).filter(
      ({ id, quantity }: { id: string; quantity: number }) => id && quantity >= 1
    );
    if (requestedAddons.length > 0) {
      const addonIds = requestedAddons.map(({ id }: { id: string }) => id);
      const { data: addonRows } = await serviceClient
        .from("photographer_addons")
        .select("id, name, price, unit, photographer_id")
        .in("id", addonIds)
        .eq("photographer_id", photographer.id);
      const addonMap = new Map((addonRows ?? []).map((a: any) => [a.id, a]));
      for (const { id, quantity } of requestedAddons) {
        const addon = addonMap.get(id);
        if (addon) resolvedAddons.push({ id: addon.id, name: addon.name, price: addon.price, unit: addon.unit, quantity });
      }
    }

    // Compute total server-side
    const addonTotal = resolvedAddons.reduce((sum, a) => sum + a.price * a.quantity, 0);
    const total = pkg.price + addonTotal;
    const priceDisplay = `${total.toLocaleString()} NOK`;

    // Insert booking — only after all pre-checks pass
    const { data: booking, error: insertError } = await serviceClient
      .from("bookings")
      .insert({
        client_id: user.id,
        client_name: user.user_metadata?.name || "",
        client_email: user.email,
        photographer_name: photographerName,
        photographer_id: photographerId,
        photographer_email: photographerEmail,
        session_type: pkg.name,
        date,
        location,
        message,
        price: priceDisplay,
        status: "awaiting_payment",
        cancellation_policy_snapshot: photographer.cancellation_policy || "moderate",
        terms_snapshot: {
          photos_delivered: `${pkg.photos_delivered} photos`,
          delivery_time: photographer.delivery_time || null,
          copyright_ownership: photographer.copyright_ownership || null,
          editing_style: photographer.editing_style || null,
          revisions_included: photographer.revisions_included || null,
        },
        package_snapshot: {
          id: pkg.id,
          name: pkg.name,
          duration: pkg.duration,
          photos_delivered: pkg.photos_delivered,
          price: pkg.price,
          description: pkg.description || null,
        },
        addons_snapshot: resolvedAddons,
      })
      .select("id")
      .single();

    if (insertError || !booking) {
      console.error("Booking insert error:", insertError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    const stripeAccount = await stripe.accounts.retrieve(photographer.stripe_account_id);
    const currency = stripeAccount.default_currency || "usd";

    // Build line items: one per package + one per add-on (shows clean breakdown on Stripe receipt)
    const lineItems = [
      {
        price_data: {
          currency,
          product_data: {
            name: `${pkg.name} with ${photographerName}`,
            description: `${pkg.duration} · ${pkg.photos_delivered} photos${date ? ` — ${date}` : ""}`,
          },
          unit_amount: pkg.price * 100,
        },
        quantity: 1,
      },
      ...resolvedAddons.map(a => ({
        price_data: {
          currency,
          product_data: { name: `${a.name} (${a.unit})` },
          unit_amount: a.price * 100,
        },
        quantity: a.quantity,
      })),
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      payment_intent_data: {
        transfer_group: booking.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?booking=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/photographers`,
      metadata: { bookingId: booking.id },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
