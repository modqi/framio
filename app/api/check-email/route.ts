import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // GoTrue admin /users supports a `filter` param that does a LIKE search on email.
  // We fetch a small page and verify exact match to handle partial-match false positives.
  const url = new URL(`${baseUrl}/auth/v1/admin/users`);
  url.searchParams.set("filter", normalized);
  url.searchParams.set("per_page", "10");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });

  if (!res.ok) {
    console.error("[check-email] GoTrue error:", res.status, await res.text());
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const data = await res.json();
  const exists =
    Array.isArray(data.users) &&
    data.users.some((u: { email?: string }) => u.email?.toLowerCase() === normalized);

  return NextResponse.json({ exists });
}
