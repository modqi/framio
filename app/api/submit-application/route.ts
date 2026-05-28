import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_SPECIALTIES = new Set([
  "Weddings", "Portraits", "Family & Newborn", "Maternity", "Events",
  "Corporate & Headshots", "Boudoir", "Products", "Food", "Real Estate",
  "Architecture", "Fashion", "Automotive", "Drone & Aerial", "Sports",
  "Pets & Animals", "Concerts & Music", "Travel", "Nature & Landscape",
  "Street & Documentary", "Artistic & Fine Art",
]);

// 5 submissions per 10 min per IP
const rateLimit = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 600_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const name     = str(body.name, 100);
  const email    = str(body.email, 200);
  const location = str(body.location, 200);
  const about    = str(body.about, 1000);
  const specialties: unknown = body.specialties;

  if (!name || !email || !location || !about) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!Array.isArray(specialties) || specialties.length === 0) {
    return NextResponse.json({ error: "At least one specialty is required" }, { status: 400 });
  }

  const invalid = (specialties as string[]).filter(s => !ALLOWED_SPECIALTIES.has(s));
  if (invalid.length > 0) {
    return NextResponse.json({ error: "Invalid specialty values" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("applications").insert({
    name,
    email,
    location,
    specialty: (specialties as string[]).join(", "),
    experience: str(body.experience, 100) || null,
    instagram:  str(body.instagram, 100) || null,
    portfolio_link: str(body.portfolio_link, 500) || null,
    about,
    status: "pending",
  });

  if (error) {
    console.error("[submit-application]", error.message);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
