import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      photographerEmail,
      photographerName,
      clientName,
      clientEmail,
      sessionType,
      date,
      location,
      message,
      price,
    } = body;

    await resend.emails.send({
      from: "Framio <onboarding@resend.dev>",
      to: "muhannadsedqi@gmail.com",
      subject: `New booking request from ${clientName}!`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
          
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Framio</h1>
            <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
          </div>

          <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">NEW BOOKING REQUEST</p>
            <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 24px;">
              ${clientName} wants to book you!
            </h2>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">CLIENT</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${clientName}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">EMAIL</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${clientEmail}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${sessionType}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${date || "Not specified"}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">LOCATION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${location || "Not specified"}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PRICE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${price}</span>
                </td>
              </tr>
            </table>

            ${message ? `
            <div style="margin-top: 20px; padding: 16px; background: #FDF8F5; border-radius: 8px; border: 1px solid #f0e8e0;">
              <p style="font-size: 11px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">MESSAGE FROM CLIENT</p>
              <p style="font-size: 14px; color: #555; margin: 0; font-style: italic; line-height: 1.7;">"${message}"</p>
            </div>
            ` : ""}
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://framio-alpha.vercel.app/photographer-dashboard" 
               style="background: #1a1a1a; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              View booking request
            </a>
          </div>

          <div style="background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #f0f0f0; text-align: center;">
            <p style="font-size: 13px; color: #888; margin: 0 0 4px;">Log in to your dashboard to accept or decline</p>
            <p style="font-size: 12px; color: #aaa; margin: 0;">You must respond within 24 hours</p>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Framio. All rights reserved.</p>
          </div>

        </div>
      `,
    });

    await resend.emails.send({
      from: "Framio <onboarding@resend.dev>",
      to: clientEmail,
      subject: `Your booking request to ${photographerName} has been sent!`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF8;">
          
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; margin: 0 0 8px;">Framio</h1>
            <p style="font-size: 11px; letter-spacing: 3px; color: #C4907A; margin: 0;">PHOTOGRAPHY MARKETPLACE</p>
          </div>

          <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #f0f0f0; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C4907A; margin: 0 0 8px; letter-spacing: 1px;">BOOKING CONFIRMED</p>
            <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0 0 8px;">
              Your request has been sent!
            </h2>
            <p style="font-size: 14px; color: #888; margin: 0 0 24px; line-height: 1.7;">
              ${photographerName} will respond to your booking request within 24 hours.
            </p>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PHOTOGRAPHER</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${photographerName}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">SESSION</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${sessionType}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">DATE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${date || "Not specified"}</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 11px; color: #C4907A; display: block; margin-bottom: 4px;">PRICE</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${price}</span>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://framio-alpha.vercel.app/dashboard" 
               style="background: #C4907A; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              View my bookings
            </a>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <p style="font-size: 11px; color: #aaa; margin: 0;">© 2026 Framio. All rights reserved.</p>
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