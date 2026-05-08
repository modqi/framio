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
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Block if a pending request already exists
  const { data: existing } = await serviceClient
    .from("account_deletion_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "already_pending" }, { status: 409 });
  }

  const userRole: "client" | "photographer" =
    user.user_metadata?.role === "photographer" ? "photographer" : "client";
  const userName = user.user_metadata?.name || "User";
  const userEmail = user.email!;
  const idColumn = userRole === "client" ? "client_id" : "photographer_id";

  // Find active bookings — always fully refunded for account closure regardless of policy
  const { data: bookings } = await serviceClient
    .from("bookings")
    .select("id, client_name, client_email, photographer_name, photographer_email, session_type, date, stripe_payment_intent_id")
    .in("status", ["pending", "confirmed"])
    .eq(idColumn, user.id);

  for (const booking of bookings || []) {
    let refunded = false;
    if (booking.stripe_payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });
        refunded = true;
      } catch (err: any) {
        console.error("[request-deletion] Stripe refund failed:", booking.id, err?.message);
      }
    }

    await serviceClient.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);

    // Notify the other party
    const notifyEmail = userRole === "client" ? booking.photographer_email : booking.client_email;
    const closingParty = userRole === "client" ? "client" : "photographer";

    if (notifyEmail) {
      await resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: notifyEmail,
        subject: "Your booking has been cancelled — account closure",
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
              <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">BOOKING CANCELLED</p>
              <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">A booking has been cancelled</h2>
              <p style="font-size: 14px; color: #555; margin: 0 0 20px; line-height: 1.7;">
                The ${esc(closingParty)} on this booking has requested account closure. All active bookings are automatically cancelled as part of this process.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.session_type)}</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(booking.date || "Not set")}</span>
                  </td>
                </tr>
              </table>
              ${userRole === "photographer"
                ? refunded
                  ? `<p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">A full refund has been issued to you and will appear in 5–10 business days.</p>`
                  : `<p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">A full refund is due. If you do not see it in 5–10 business days, contact <a href="mailto:hello@lomissa.com" style="color: #C4907A;">hello@lomissa.com</a>.</p>`
                : `<p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">No refund is applicable to this booking.</p>`
              }
            </div>
            <div style="background: #FDF8F5; border-radius: 12px; padding: 20px; border: 1px solid #f0e8e0; text-align: center; margin-bottom: 32px;">
              <p style="font-size: 13px; color: #888; margin: 0 0 4px;">Questions? We are here to help.</p>
              <a href="mailto:hello@lomissa.com" style="font-size: 13px; color: #C4907A; text-decoration: none;">hello@lomissa.com</a>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
            </div>
          </div>
        `,
      });
    }
  }

  // Insert deletion request (scheduled_deletion_at defaults to now() + 30 days in DB)
  const { error: insertError } = await serviceClient
    .from("account_deletion_requests")
    .insert({ user_id: user.id, user_email: userEmail, user_role: userRole });

  if (insertError) {
    console.error("[request-deletion] Insert failed:", insertError);
    return NextResponse.json({ error: "Failed to create deletion request" }, { status: 500 });
  }

  const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const dashboardUrl = userRole === "photographer"
    ? "https://lomissa.com/photographer-dashboard"
    : "https://lomissa.com/dashboard";
  const cancelledCount = (bookings || []).length;

  await resend.emails.send({
    from: "Lomissa <hello@lomissa.com>",
    to: userEmail,
    subject: "Your Lomissa account will be deleted in 30 days",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
          <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">ACCOUNT DELETION REQUESTED</p>
          <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">
            We have received your request, ${esc(userName)}
          </h2>
          <p style="font-size: 14px; color: #555; margin: 0 0 20px; line-height: 1.7;">
            Your account is scheduled for permanent deletion on <strong>${esc(formattedDate)}</strong>. After this date all personal data will be anonymised and cannot be recovered.
          </p>
          ${cancelledCount > 0 ? `
          <div style="background: #FDF8F5; border-radius: 8px; padding: 16px; border: 1px solid #f0e8e0; margin-bottom: 20px;">
            <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.7;">
              <strong>${cancelledCount} active booking${cancelledCount > 1 ? "s have" : " has"} been cancelled</strong> and full refunds issued. Completed past sessions are not affected.
            </p>
          </div>
          ` : ""}
          <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">
            Changed your mind? You can cancel this request from your dashboard at any time before ${esc(formattedDate)}.
          </p>
        </div>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${esc(dashboardUrl)}"
             style="background: #1a1a1a; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
            Cancel deletion request →
          </a>
        </div>
        <div style="background: #FDF8F5; border-radius: 12px; padding: 20px; border: 1px solid #f0e8e0; text-align: center; margin-bottom: 32px;">
          <p style="font-size: 13px; color: #888; margin: 0 0 4px;">Questions? We are here to help.</p>
          <a href="mailto:hello@lomissa.com" style="font-size: 13px; color: #C4907A; text-decoration: none;">hello@lomissa.com</a>
        </div>
        <div style="text-align: center;">
          <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({
    success: true,
    scheduledDate: scheduledDate.toISOString(),
    cancelledBookings: cancelledCount,
  });
}
