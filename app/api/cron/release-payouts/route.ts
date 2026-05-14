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

const emailHeader = `
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
    <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
  </div>`;

const emailFooter = `
  <div style="text-align: center; margin-top: 32px;">
    <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
  </div>`;

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const results = {
    confirmed_to_completed: 0,
    released: 0,
    expiry_reminders_sent: 0,
    expired_cancelled: 0,
    errors: [] as string[],
  };

  // ── 1. Transition confirmed → completed for sessions whose date has passed ──
  const { data: confirmedBookings } = await serviceClient
    .from("bookings")
    .select("id")
    .eq("status", "confirmed")
    .lt("date", today);

  if (confirmedBookings?.length) {
    const { error } = await serviceClient
      .from("bookings")
      .update({ status: "completed" })
      .in("id", confirmedBookings.map((b: any) => b.id));
    if (!error) results.confirmed_to_completed = confirmedBookings.length;
  }

  // ── 2. Auto-release photos_delivered → paid_out (7-day dispute window) ──
  const { data: deliveredBookings } = await serviceClient
    .from("bookings")
    .select("id, stripe_payment_intent_id, photographer_id")
    .eq("status", "photos_delivered")
    .lt("payout_due_at", now.toISOString());

  for (const booking of deliveredBookings || []) {
    try {
      if (!booking.stripe_payment_intent_id) {
        results.errors.push(`Booking ${booking.id}: no payment intent`);
        continue;
      }

      const { data: photographerRow } = await serviceClient
        .from("photographers")
        .select("stripe_account_id")
        .eq("user_id", booking.photographer_id)
        .single();

      if (!photographerRow?.stripe_account_id) {
        results.errors.push(`Booking ${booking.id}: photographer has no Stripe account`);
        continue;
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
      const amount = paymentIntent.amount;
      const currency = paymentIntent.currency;
      const netAmount = amount - Math.round(amount * 0.10);

      const transfer = await stripe.transfers.create({
        amount: netAmount,
        currency,
        destination: photographerRow.stripe_account_id,
        transfer_group: booking.id,
        source_transaction: paymentIntent.latest_charge as string,
      });

      await serviceClient
        .from("bookings")
        .update({
          status: "paid_out",
          payout_released_at: now.toISOString(),
          stripe_transfer_id: transfer.id,
        })
        .eq("id", booking.id);

      results.released++;
    } catch (err: any) {
      results.errors.push(`Booking ${booking.id}: ${err?.message}`);
    }
  }

  // ── 3. Send 12-hour expiry reminder to photographer ──
  const reminderCutoff = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();

  const { data: reminderBookings } = await serviceClient
    .from("bookings")
    .select("id, photographer_email, photographer_name, client_name, session_type, date, expires_at")
    .eq("status", "pending")
    .eq("expiry_reminder_sent", false)
    .not("expires_at", "is", null)
    .gt("expires_at", now.toISOString())
    .lt("expires_at", reminderCutoff);

  for (const booking of reminderBookings || []) {
    try {
      const expiresAt = new Date(booking.expires_at);
      const hoursLeft = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

      await resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: booking.photographer_email,
        subject: `Action required — booking request expiring in ${hoursLeft}h`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
            ${emailHeader}
            <div style="background: #fff3cd; border-radius: 12px; padding: 32px; border: 1px solid #ffc107; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #b45309; margin: 0 0 8px; letter-spacing: 1px;">ACTION REQUIRED</p>
              <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 12px;">
                Booking request expiring in ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}
              </h2>
              <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">
                You have a pending booking request from <strong>${esc(booking.client_name)}</strong> that will
                expire in approximately ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"} if you don't respond.
                If it expires, the client will be automatically refunded.
              </p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #C4907A; margin: 0 0 16px; letter-spacing: 1px;">BOOKING DETAILS</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">CLIENT</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.client_name)}</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.session_type)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.date || "Not specified")}</span>
                  </td>
                </tr>
              </table>
            </div>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="https://lomissa.com/photographer-dashboard"
                 style="background: #1a1a1a; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                Respond now →
              </a>
            </div>
            ${emailFooter}
          </div>
        `,
      });

      await serviceClient
        .from("bookings")
        .update({ expiry_reminder_sent: true })
        .eq("id", booking.id);

      results.expiry_reminders_sent++;
    } catch (err: any) {
      results.errors.push(`Reminder ${booking.id}: ${err?.message}`);
    }
  }

  // ── 4. Cancel expired pending bookings and refund clients ──
  const { data: expiredBookings } = await serviceClient
    .from("bookings")
    .select("id, stripe_payment_intent_id, client_email, client_name, photographer_email, photographer_name, session_type, date")
    .eq("status", "pending")
    .not("expires_at", "is", null)
    .lt("expires_at", now.toISOString());

  for (const booking of expiredBookings || []) {
    try {
      // Issue full refund
      if (booking.stripe_payment_intent_id) {
        try {
          await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });
        } catch (refundErr: any) {
          // Log but don't abort — still cancel and email; manual refund required
          results.errors.push(`Refund failed for expired booking ${booking.id}: ${refundErr?.message}`);
        }
      }

      await serviceClient
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);

      // Email to client
      await resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: booking.client_email,
        subject: `Your booking request to ${esc(booking.photographer_name)} has expired`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
            ${emailHeader}
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">BOOKING EXPIRED</p>
              <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">
                Your booking request has expired
              </h2>
              <p style="font-size: 14px; color: #555; margin: 0 0 16px; line-height: 1.7;">
                Unfortunately, <strong>${esc(booking.photographer_name)}</strong> did not respond to your booking
                request for <strong>${esc(booking.session_type)}</strong> within 24 hours.
              </p>
              <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">
                A full refund has been issued and will appear in your account within 5–10 business days.
              </p>
            </div>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="https://lomissa.com/photographers"
                 style="background: #C4907A; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                Find another photographer →
              </a>
            </div>
            <div style="background: #FDF8F5; border-radius: 12px; padding: 20px; border: 1px solid #f0e8e0; text-align: center; margin-bottom: 32px;">
              <p style="font-size: 13px; color: #888; margin: 0 0 4px;">Questions? We're here to help.</p>
              <a href="mailto:hello@lomissa.com" style="font-size: 13px; color: #C4907A; text-decoration: none;">hello@lomissa.com</a>
            </div>
            ${emailFooter}
          </div>
        `,
      });

      // Email to photographer
      await resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: booking.photographer_email,
        subject: `A booking request from ${esc(booking.client_name)} has expired`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
            ${emailHeader}
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">BOOKING EXPIRED</p>
              <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">
                A booking request has expired
              </h2>
              <p style="font-size: 14px; color: #555; margin: 0 0 16px; line-height: 1.7;">
                The booking request from <strong>${esc(booking.client_name)}</strong> for
                <strong>${esc(booking.session_type)}</strong> on ${esc(booking.date || "an unspecified date")}
                was not responded to within 24 hours and has been automatically cancelled.
                The client has been fully refunded.
              </p>
              <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">
                Responding promptly to booking requests helps keep your response rate high and builds client trust.
              </p>
            </div>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="https://lomissa.com/photographer-dashboard"
                 style="background: #1a1a1a; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                Go to my dashboard →
              </a>
            </div>
            ${emailFooter}
          </div>
        `,
      });

      results.expired_cancelled++;
    } catch (err: any) {
      results.errors.push(`Expiry cancel ${booking.id}: ${err?.message}`);
    }
  }

  console.log("[cron/release-payouts]", results);
  return NextResponse.json(results);
}
