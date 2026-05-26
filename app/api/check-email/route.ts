import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit store.
// On Vercel serverless each warm instance has its own Map, so this limits burst
// traffic per instance rather than globally. Sufficient for abuse prevention on
// a low-traffic platform; swap for Redis/Upstash for stricter cross-instance limits.
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 10;
const WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= LIMIT) return true;
  entry.count++;
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = body?.email;

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // GoTrue admin /users supports a `filter` param (LIKE search on email).
  // We verify exact match server-side to handle partial-match false positives.
  const url = new URL(`${baseUrl}/auth/v1/admin/users`);
  url.searchParams.set("filter", normalized);
  url.searchParams.set("per_page", "10");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    });

    if (!res.ok) {
      console.error("[check-email] GoTrue responded", res.status);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    const data = await res.json();
    const exists =
      Array.isArray(data.users) &&
      data.users.some((u: { email?: string }) => u.email?.toLowerCase() === normalized);

    // Only { exists } is returned — no names, roles, or other account details.
    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
