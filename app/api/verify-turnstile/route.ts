import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ success: true });
  }

  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, error: "Missing token." }, { status: 400 });
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const data = await res.json();

  console.log("[verify-turnstile] Cloudflare response:", JSON.stringify(data));

  if (!data.success) {
    return NextResponse.json({ success: false, error: "Security check failed.", debug: data }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
