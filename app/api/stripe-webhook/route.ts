import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  const secretSet = !!process.env.STRIPE_WEBHOOK_SECRET;
  const secretPrefix = process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 14) ?? "(not set)";

  console.log("[webhook] sig present:", !!sig);
  console.log("[webhook] body length:", body.length);
  console.log("[webhook] STRIPE_WEBHOOK_SECRET set:", secretSet, "| prefix:", secretPrefix);

  if (!sig) {
    console.error("[webhook] No stripe-signature header");
    return NextResponse.json({ error: "missing_sig_header", message: "No stripe-signature header received" }, { status: 400 });
  }

  if (!secretSet) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET env var is not set on this deployment");
    return NextResponse.json({ error: "missing_secret", message: "STRIPE_WEBHOOK_SECRET is not configured in environment variables" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("[webhook] constructEvent failed:", err?.message, "| secret prefix used:", secretPrefix);
    return NextResponse.json({
      error: "signature_mismatch",
      message: err?.message,
      hint: "The STRIPE_WEBHOOK_SECRET in your environment does not match the signing secret for this webhook endpoint. Get the correct secret from Stripe Dashboard → Webhooks → click endpoint → Reveal signing secret.",
    }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return NextResponse.json({ received: true });

    // Flip status so the booking becomes visible to both parties
    const { data: booking } = await serviceClient
      .from("bookings")
      .update({ status: "pending", stripe_payment_intent_id: session.payment_intent as string })
      .eq("id", bookingId)
      .eq("status", "awaiting_payment")
      .select("*")
      .single();

    if (!booking) return NextResponse.json({ received: true });

    const {
      photographer_name: photographerName,
      photographer_email: photographerEmail,
      client_name: clientName,
      client_email: clientEmail,
      session_type: sessionType,
      date,
      location,
      message,
      price,
    } = booking;

    // Notify photographer — new paid booking waiting for their response
    await resend.emails.send({
      from: "Lomissa <hello@lomissa.com>",
      to: photographerEmail || "hello@lomissa.com",
      subject: `New booking request from ${esc(clientName)}!`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
            <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
          </div>
          <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">NEW BOOKING REQUEST</p>
            <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 24px;">
              ${esc(clientName)} wants to book you!
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">CLIENT</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(clientName)}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">EMAIL</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(clientEmail)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(sessionType)}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(date || "Not specified")}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">LOCATION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(location || "Not specified")}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PRICE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(price)}</span>
                </td>
              </tr>
            </table>
            ${message ? `
            <div style="margin-top: 20px; padding: 16px; background: #FDF8F5; border-radius: 8px; border: 1px solid #f0e8e0;">
              <p style="font-size: 11px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">MESSAGE FROM CLIENT</p>
              <p style="font-size: 14px; color: #555; margin: 0; font-style: italic; line-height: 1.7;">"${esc(message)}"</p>
            </div>
            ` : ""}
          </div>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://lomissa.com/photographer-dashboard"
               style="background: #1a1a1a; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              View booking request
            </a>
          </div>
          <div style="text-align: center;">
            <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    // Confirm to client — their payment went through and the request is with the photographer
    await resend.emails.send({
      from: "Lomissa <hello@lomissa.com>",
      to: clientEmail,
      subject: `Your booking request to ${esc(photographerName)} has been sent!`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
            <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
          </div>
          <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">BOOKING CONFIRMED</p>
            <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 8px;">
              Your request has been sent!
            </h2>
            <p style="font-size: 14px; color: #888; margin: 0 0 24px; line-height: 1.7;">
              ${esc(photographerName)} will respond to your booking request within 24 hours.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PHOTOGRAPHER</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(photographerName)}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(sessionType)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(date || "Not specified")}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PRICE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(price)}</span>
                </td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://lomissa.com/dashboard"
               style="background: #C4907A; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              View my bookings
            </a>
          </div>
          <div style="text-align: center;">
            <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }

  return NextResponse.json({ received: true });
}
