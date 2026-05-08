import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extracts the Cloudinary public_id from a secure_url.
// e.g. https://res.cloudinary.com/cloud/image/upload/q_95/v123/frameyou/deliveries/abc.jpg
//   → frameyou/deliveries/abc
function extractPublicId(url: string): string {
  const clean = url.split("?")[0];
  const match = clean.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)$/);
  if (match) return match[1].replace(/\.[^.]+$/, "");
  const i = clean.indexOf("/upload/");
  return i >= 0 ? clean.slice(i + 8).replace(/\.[^.]+$/, "") : clean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deliveryId = typeof params?.then === "function"
    ? (await params).deliveryId
    : params.deliveryId;

  // Verify the caller is a party to this delivery
  const { data: delivery } = await serviceClient
    .from("photo_deliveries")
    .select("id, photographer_id, client_id")
    .eq("id", deliveryId)
    .single();

  if (!delivery) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  if (delivery.photographer_id !== user.id && delivery.client_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: photos } = await serviceClient
    .from("delivered_photos")
    .select("cloudinary_url, filename")
    .eq("delivery_id", deliveryId);

  if (!photos?.length) return NextResponse.json({ error: "No photos found" }, { status: 404 });

  const publicIds = photos.map((p: any) => extractPublicId(p.cloudinary_url));

  const zipUrl = cloudinary.utils.download_zip_url({
    public_ids: publicIds,
    resource_type: "image",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });

  return NextResponse.redirect(zipUrl);
}
