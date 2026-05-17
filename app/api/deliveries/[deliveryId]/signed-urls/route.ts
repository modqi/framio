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

function extractPublicId(url: string): string {
  const clean = url.split("?")[0];
  const match = clean.match(/\/image\/(?:upload|authenticated)\/(?:[^/]+\/)*v\d+\/(.+)$/);
  if (match) return match[1].replace(/\.[^.]+$/, "");
  const i = clean.search(/\/(?:upload|authenticated)\//);
  if (i >= 0) {
    return clean.slice(i).replace(/^\/(?:upload|authenticated)\//, "").replace(/\.[^.]+$/, "");
  }
  return clean;
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
    .select("id, cloudinary_url, cloudinary_public_id, storage_path, filename")
    .eq("delivery_id", deliveryId);

  const signedUrls: Record<string, string> = {};
  const downloadUrls: Record<string, string> = {};

  // Track the longest expiry so the client knows when to refresh
  let expiresAtMs = 0;

  const cloudinaryExpiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour for Cloudinary
  const storageExpiresIn = 86400; // 24 hours for Supabase Storage

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  for (const photo of photos || []) {
    if (photo.storage_path) {
      // New Supabase Storage photo
      const [viewResult, dlResult] = await Promise.all([
        serviceClient.storage.from("deliveries").createSignedUrl(photo.storage_path, storageExpiresIn),
        serviceClient.storage.from("deliveries").createSignedUrl(photo.storage_path, storageExpiresIn, {
          download: photo.filename || true,
        }),
      ]);

      if (viewResult.data?.signedUrl) {
        // Wrap in Cloudinary Fetch for CDN caching + auto quality/format on the gallery grid
        signedUrls[photo.id] = `https://res.cloudinary.com/${cloudName}/image/fetch/q_auto,f_auto/${encodeURIComponent(viewResult.data.signedUrl)}`;
        const expiryMs = Date.now() + storageExpiresIn * 1000;
        if (expiryMs > expiresAtMs) expiresAtMs = expiryMs;
      }

      if (dlResult.data?.signedUrl) {
        downloadUrls[photo.id] = dlResult.data.signedUrl;
      }
    } else if (photo.cloudinary_url) {
      // Legacy Cloudinary photo — existing logic unchanged
      const publicId = photo.cloudinary_public_id || extractPublicId(photo.cloudinary_url);
      const type = photo.cloudinary_public_id ? "authenticated" : "upload";

      signedUrls[photo.id] = cloudinary.url(publicId, {
        sign_url: true,
        type,
        expires_at: cloudinaryExpiresAt,
        secure: true,
      });

      downloadUrls[photo.id] = cloudinary.url(publicId, {
        sign_url: true,
        type,
        expires_at: cloudinaryExpiresAt,
        flags: "attachment",
        secure: true,
      });

      const cloudinaryExpiryMs = cloudinaryExpiresAt * 1000;
      if (cloudinaryExpiryMs > expiresAtMs) expiresAtMs = cloudinaryExpiryMs;
    }
  }

  return NextResponse.json({
    signedUrls,
    downloadUrls,
    expiresAt: new Date(expiresAtMs).toISOString(),
  });
}
