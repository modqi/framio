import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

// Per-IP rate limit for the unauthenticated photographer_application path.
// Resets on cold start — intentional (serverless, not a hard quota).
const applicationRateLimit = new Map<string, number[]>();

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      senderName,
      senderId,
      clientId,
      bookingId,
      message,
      date,
    } = body;

    // Auth gate — all types require a valid user session except "photographer_application",
    // which is submitted from the public join form before any account exists and sends
    // only to the hardcoded admin address with HTML-escaped content.
    const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
    let authClient: ReturnType<typeof createClient> | null = null;
    let user: any = null;

    if (type !== "photographer_application") {
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const authResult = await authClient.auth.getUser(token);
      user = authResult.data.user;
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Service client for DB lookups that require elevated access
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── New message notification ──────────────────────────────────────────────
    if (type === "new_message") {
      if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });

      // Fetch booking parties from DB — never trust body-supplied emails
      const { data: msgBooking } = await serviceClient
        .from("bookings")
        .select("client_id, photographer_id, client_email, photographer_email, date")
        .eq("id", bookingId)
        .single();

      if (!msgBooking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

      const isMessageClient = msgBooking.client_id === user.id;
      const isMessagePhotographer = msgBooking.photographer_id === user.id;
      if (!isMessageClient && !isMessagePhotographer) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Throttle: send at most 1 email per 10 minutes per booking per sender.
      const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentMessages } = await authClient!
        .from("messages")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("sender_id", user.id)   // use authenticated user ID, not body-supplied senderId
        .gte("created_at", windowStart);

      if ((recentMessages?.length ?? 0) >= 2) {
        return NextResponse.json({ success: true });
      }

      // Recipient is always the other party, fetched from DB
      const recipientEmail = isMessageClient
        ? msgBooking.photographer_email
        : msgBooking.client_email;

      if (!recipientEmail) return NextResponse.json({ success: true });

      await resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: recipientEmail,
        subject: `New message from ${esc(senderName)} on Lomissa`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
              <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">NEW MESSAGE</p>
              <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">
                ${esc(senderName)} sent you a message
              </h2>
              <div style="background: #FDF8F5; border-radius: 8px; padding: 16px; border: 1px solid #f0e8e0; margin-bottom: 24px;">
                <p style="font-size: 14px; color: #555; margin: 0; font-style: italic; line-height: 1.7;">"${esc(message)}"</p>
              </div>
              <p style="font-size: 13px; color: #888; margin: 0;">Regarding your booking on ${esc(msgBooking.date || "")}</p>
            </div>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="https://lomissa.com/messages/${esc(bookingId)}"
                 style="background: #C4907A; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                Reply on Lomissa →
              </a>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
            </div>
          </div>
        `,
      });
      return NextResponse.json({ success: true });
    }

    // ── Application notification to admin (unauthenticated, rate-limited) ─────
    if (type === "photographer_application") {
      const { clientName, clientEmail, location, message: appMessage, date: appDate } = body;

      const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      const now = Date.now();
      const hour = 60 * 60 * 1000;
      const hits = (applicationRateLimit.get(ip) ?? []).filter(t => now - t < hour);
      if (hits.length >= 3) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
      applicationRateLimit.set(ip, [...hits, now]);

      await resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: "hello@lomissa.com",
        subject: `New photographer application — ${esc(clientName)}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
              <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">ADMIN NOTIFICATION</p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">NEW APPLICATION</p>
              <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 24px;">
                ${esc(clientName)} wants to join Lomissa!
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">NAME</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(clientName)}</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">EMAIL</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(clientEmail)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">LOCATION</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(location || "Not specified")}</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(appDate)}</span>
                  </td>
                </tr>
              </table>
              ${appMessage ? `
              <div style="margin-top: 20px; padding: 16px; background: #FDF8F5; border-radius: 8px; border: 1px solid #f0e8e0;">
                <p style="font-size: 11px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">APPLICATION DETAILS</p>
                <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">${esc(appMessage)}</p>
              </div>
              ` : ""}
            </div>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="https://lomissa.com/studio-access"
                 style="background: #1a1a1a; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                Review application →
              </a>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
            </div>
          </div>
        `,
      });
      return NextResponse.json({ success: true });
    }

    // ── Admin-only email types: photographer_approved / photographer_rejected ──
    // These send emails on behalf of the platform. Only admins may trigger them.
    if (type === "photographer_approved" || type === "photographer_rejected") {
      const { data: adminRow } = await serviceClient
        .from("admin_users")
        .select("email")
        .eq("email", user.email)
        .single();
      if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const { clientEmail, clientName, onboardingUrl, message: rejMsg } = body;

      if (type === "photographer_approved") {
        const ctaUrl = typeof onboardingUrl === "string" && onboardingUrl.startsWith("https://")
          ? onboardingUrl
          : "https://lomissa.com/login";

        await resend.emails.send({
          from: "Lomissa <hello@lomissa.com>",
          to: clientEmail,
          subject: `Welcome to Lomissa, ${esc(clientName)}!`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
                <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
              </div>
              <div style="background: #1a1a1a; border-radius: 12px; padding: 40px 32px; text-align: center; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #C4907A; margin: 0 0 16px; letter-spacing: 1px;">YOU HAVE BEEN SELECTED</p>
                <h2 style="font-family: Georgia, serif; font-size: 32px; color: #fff; margin: 0 0 16px; letter-spacing: -1px;">
                  Welcome to Lomissa, ${esc(clientName)}!
                </h2>
                <p style="font-size: 15px; color: rgba(255,255,255,0.6); margin: 0; line-height: 1.8;">
                  Your application has been reviewed and approved. You are now part of our hand-picked community of photographers.
                </p>
              </div>
              <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">ONE STEP BEFORE YOU GO LIVE</p>
                <p style="font-size: 14px; color: #555; margin: 0 0 20px; line-height: 1.7;">
                  To receive payouts from your bookings, you need to connect your bank account via Stripe. This takes about 5 minutes and your profile will go live automatically once complete.
                </p>
                <div style="background: #FDF8F5; border-radius: 8px; padding: 16px; border: 1px solid #f0e8e0; margin-bottom: 20px;">
                  <p style="font-size: 12px; color: #C4907A; margin: 0 0 4px; letter-spacing: 1px;">NOTE</p>
                  <p style="font-size: 13px; color: #888; margin: 0; line-height: 1.6;">This link expires in 24 hours. If it expires, log in to your dashboard to generate a new one.</p>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${esc(ctaUrl)}"
                   style="background: #C4907A; color: #fff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
                  Connect your bank account →
                </a>
              </div>
              <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #C4907A; margin: 0 0 16px; letter-spacing: 1px;">AFTER YOU CONNECT</p>
                ${[
                  "Your profile goes live — clients can browse and book you",
                  "Complete your profile: add bio, portfolio photos, and set your price",
                  "Set your availability calendar",
                  "Accept bookings and receive 90% of every session fee",
                ].map((step, i) => `
                  <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px;">
                    <span style="font-size: 12px; color: #C4907A; font-weight: 600; flex-shrink: 0; min-width: 24px;">0${i + 1}</span>
                    <span style="font-size: 14px; color: #555;">${step}</span>
                  </div>
                `).join("")}
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
        return NextResponse.json({ success: true });
      }

      // photographer_rejected
      await resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: clientEmail,
        subject: `Your Lomissa application — ${esc(clientName)}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
              <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
              <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 16px;">
                Thank you for applying, ${esc(clientName)}
              </h2>
              <p style="font-size: 14px; color: #555; margin: 0 0 16px; line-height: 1.8;">
                After carefully reviewing your application we have decided not to move forward at this time.
              </p>
              <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.8;">
                ${esc(rejMsg)}
              </p>
            </div>
            <div style="background: #FDF8F5; border-radius: 12px; padding: 20px; border: 1px solid #f0e8e0; text-align: center; margin-bottom: 32px;">
              <p style="font-size: 13px; color: #888; margin: 0 0 4px;">You are welcome to reapply in the future.</p>
              <a href="https://lomissa.com/signup" style="font-size: 13px; color: #C4907A; text-decoration: none;">lomissa.com/signup</a>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Lomissa. All rights reserved.</p>
            </div>
          </div>
        `,
      });
      return NextResponse.json({ success: true });
    }

    // ── Booking confirmed — notify client ─────────────────────────────────────
    if (type === "booking_confirmed") {
      if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
      const { data: bkConfirmed } = await (authClient as any)
        .from("bookings")
        .select("client_email, photographer_name, session_type, date, location, price")
        .eq("id", bookingId)
        .eq("client_id", user.id)
        .single();
      if (!bkConfirmed) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

      await resend.emails.send({
        from: "Lomissa <hello@lomissa.com>",
        to: bkConfirmed.client_email,
        subject: `Your booking with ${esc(bkConfirmed.photographer_name)} is confirmed!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
              <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
            </div>
            <div style="background: #1a1a1a; border-radius: 12px; padding: 40px 32px; text-align: center; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #C4907A; margin: 0 0 16px; letter-spacing: 1px;">BOOKING CONFIRMED</p>
              <h2 style="font-family: Georgia, serif; font-size: 32px; color: #fff; margin: 0 0 16px; letter-spacing: -1px;">
                Your session is confirmed!
              </h2>
              <p style="font-size: 15px; color: rgba(255,255,255,0.6); margin: 0; line-height: 1.8;">
                ${esc(bkConfirmed.photographer_name)} has accepted your booking request.
              </p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #C4907A; margin: 0 0 16px; letter-spacing: 1px;">BOOKING DETAILS</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PHOTOGRAPHER</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(bkConfirmed.photographer_name)}</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(bkConfirmed.session_type)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(bkConfirmed.date || "Not specified")}</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">LOCATION</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(bkConfirmed.location || "Not specified")}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PRICE</span>
                    <span style="font-size: 14px; color: #1a1a1a;">${esc(bkConfirmed.price)}</span>
                  </td>
                </tr>
              </table>
            </div>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="https://lomissa.com/dashboard"
                 style="background: #C4907A; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                View my bookings →
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
      return NextResponse.json({ success: true });
    }

    // ── Booking request notification ──────────────────────────────────────────
    if (type !== "booking_request") {
      return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    const { data: bkRequest } = await (authClient as any)
      .from("bookings")
      .select("photographer_email, photographer_name, client_name, client_email, session_type, date, location, price, message")
      .eq("id", bookingId)
      .eq("client_id", user.id)
      .single();
    if (!bkRequest) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    await resend.emails.send({
      from: "Lomissa <hello@lomissa.com>",
      to: bkRequest.photographer_email || "hello@lomissa.com",
      subject: `New booking request from ${esc(bkRequest.client_name)}!`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Lomissa</h1>
            <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
          </div>
          <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">NEW BOOKING REQUEST</p>
            <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 24px;">
              ${esc(bkRequest.client_name)} wants to book you!
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">CLIENT</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.client_name)}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">EMAIL</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.client_email)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.session_type)}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.date || "Not specified")}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">LOCATION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.location || "Not specified")}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PRICE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.price)}</span>
                </td>
              </tr>
            </table>
            ${bkRequest.message ? `
            <div style="margin-top: 20px; padding: 16px; background: #FDF8F5; border-radius: 8px; border: 1px solid #f0e8e0;">
              <p style="font-size: 11px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">MESSAGE FROM CLIENT</p>
              <p style="font-size: 14px; color: #555; margin: 0; font-style: italic; line-height: 1.7;">"${esc(bkRequest.message)}"</p>
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

    await resend.emails.send({
      from: "Lomissa <hello@lomissa.com>",
      to: bkRequest.client_email,
      subject: `Your booking request to ${esc(bkRequest.photographer_name)} has been sent!`,
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
              ${esc(bkRequest.photographer_name)} will respond to your booking request within 24 hours.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PHOTOGRAPHER</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.photographer_name)}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.session_type)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.date || "Not specified")}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PRICE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${esc(bkRequest.price)}</span>
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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
