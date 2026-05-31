import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import en from "@/messages/en.json";
import no from "@/messages/no.json";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// {placeholder} substitution against an already-escaped param map
const fill = (tpl: string, params: Record<string, string>): string =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "");

const shell = (inner: string, footer: string): string => `
  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
      <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
    </div>
    ${inner}
    <div style="text-align: center; margin-top: 32px;">
      <p style="font-size: 11px; color: #aaa; margin: 0;">${footer}</p>
    </div>
  </div>`;

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json().catch(() => null);
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
  const action = body?.action === "accept" || body?.action === "decline" ? body.action : "";
  const locale = body?.locale === "no" ? "no" : "en";
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  if (!action) return NextResponse.json({ error: "action must be accept or decline" }, { status: 400 });

  // Ownership + state gate: must be THIS photographer's pending booking
  const { data: booking } = await serviceClient
    .from("bookings")
    .select("id, client_id, photographer_id, client_name, client_email, photographer_name, photographer_email, session_type, date, location, price, stripe_payment_intent_id, status")
    .eq("id", bookingId)
    .eq("photographer_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "pending") {
    return NextResponse.json({ error: "Booking is no longer pending" }, { status: 400 });
  }

  // ── ACCEPT ────────────────────────────────────────────────────────────────
  if (action === "accept") {
    // Optimistic lock — only the run that flips pending→confirmed proceeds
    const { count } = await serviceClient
      .from("bookings")
      .update({ status: "confirmed" }, { count: "exact" })
      .eq("id", bookingId)
      .eq("status", "pending");

    if (!count) return NextResponse.json({ error: "Booking is no longer pending" }, { status: 409 });

    await logAudit(serviceClient, {
      action: "booking_accepted",
      actorId: user.id,
      actorEmail: user.email,
      bookingId,
    });

    if (booking.client_email) {
      resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: booking.client_email,
        subject: `Your booking with ${esc(booking.photographer_name)} is confirmed!`,
        html: shell(`
          <div style="background: #1a1a1a; border-radius: 12px; padding: 40px 32px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C4907A; margin: 0 0 16px; letter-spacing: 1px;">BOOKING CONFIRMED</p>
            <h2 style="font-family: Georgia, serif; font-size: 32px; color: #fff; margin: 0 0 16px; letter-spacing: -1px;">Your session is confirmed!</h2>
            <p style="font-size: 15px; color: rgba(255,255,255,0.6); margin: 0; line-height: 1.8;">
              ${esc(booking.photographer_name)} has accepted your booking request.
            </p>
          </div>
          <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span><span style="font-size: 14px; color: #1a1a1a;">${esc(booking.session_type)}</span></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span><span style="font-size: 14px; color: #1a1a1a;">${esc(booking.date || "Not specified")}</span></td>
              </tr>
              <tr>
                <td style="padding: 12px 0;"><span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">LOCATION</span><span style="font-size: 14px; color: #1a1a1a;">${esc(booking.location || "Not specified")}</span></td>
                <td style="padding: 12px 0;"><span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PRICE</span><span style="font-size: 14px; color: #1a1a1a;">${esc(booking.price)}</span></td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin-bottom: 8px;">
            <a href="https://lomissa.com/dashboard" style="background: #C4907A; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">View my bookings →</a>
          </div>
        `, en.Emails.footer),
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, status: "confirmed" });
  }

  // ── DECLINE ───────────────────────────────────────────────────────────────
  // Claim the row into a transient state first so a refund is never issued twice.
  const { count: claimed } = await serviceClient
    .from("bookings")
    .update({ status: "declining" }, { count: "exact" })
    .eq("id", bookingId)
    .eq("status", "pending");

  if (!claimed) return NextResponse.json({ error: "Booking is no longer pending" }, { status: 409 });

  // Issue full refund — client has already paid by the time a booking is pending
  let refunded = false;
  if (booking.stripe_payment_intent_id) {
    try {
      await stripe.refunds.create(
        { payment_intent: booking.stripe_payment_intent_id },
        { idempotencyKey: `decline-${bookingId}` }
      );
      refunded = true;
    } catch (err: any) {
      // Roll back so the photographer can retry / the booking stays actionable
      await serviceClient.from("bookings").update({ status: "pending" }).eq("id", bookingId);
      console.error("[respond-booking] decline refund failed:", err?.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  } else {
    console.error("[respond-booking] decline but no payment intent on booking", bookingId);
  }

  const { error: finalizeError } = await serviceClient
    .from("bookings")
    .update({ status: "declined" })
    .eq("id", bookingId);

  if (finalizeError) {
    console.error("[respond-booking] finalize declined failed:", finalizeError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await logAudit(serviceClient, {
    action: "booking_declined",
    actorId: user.id,
    actorEmail: user.email,
    bookingId,
    stripeId: booking.stripe_payment_intent_id ?? null,
    meta: { refunded },
  });

  // Localised decline emails (actor's UI locale used for both parties)
  const m = (locale === "no" ? no : en).Emails;
  const dateSuffix = booking.date ? ` — ${esc(booking.date)}` : "";
  const p = {
    client: esc(booking.client_name),
    photographer: esc(booking.photographer_name),
    session: esc(booking.session_type),
    date: dateSuffix,
  };

  if (booking.client_email) {
    resend.emails.send({
      from: "Lomissa <hello@lomissa.com>",
      to: booking.client_email,
      subject: fill(m.declineClient.subject, p),
      html: shell(`
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">${m.declineClient.label}</p>
          <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">${m.declineClient.heading}</h2>
          <p style="font-size: 14px; color: #555; margin: 0 0 16px; line-height: 1.7;">${fill(m.declineClient.body, p)}</p>
          <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">${m.declineClient.refund}</p>
        </div>
        <div style="text-align: center;">
          <a href="https://lomissa.com/photographers" style="background: #1a1a1a; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; display: inline-block;">${m.declineClient.cta}</a>
        </div>
      `, m.footer),
    }).catch(console.error);
  }

  if (booking.photographer_email) {
    resend.emails.send({
      from: "Lomissa <hello@lomissa.com>",
      to: booking.photographer_email,
      subject: fill(m.declinePhotographer.subject, p),
      html: shell(`
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">${m.declinePhotographer.label}</p>
          <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">${m.declinePhotographer.heading}</h2>
          <p style="font-size: 14px; color: #555; margin: 0 0 16px; line-height: 1.7;">${fill(m.declinePhotographer.body, p)}</p>
          <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">${m.declinePhotographer.note}</p>
        </div>
      `, m.footer),
    }).catch(console.error);
  }

  return NextResponse.json({ success: true, status: "declined", refunded });
}
