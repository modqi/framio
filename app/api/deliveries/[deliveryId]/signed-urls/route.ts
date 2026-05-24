import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

  const signedUrls: Record<string, string> = {};  // 600px WebP thumbnails for grid
  const fullUrls: Record<string, string> = {};    // original quality for lightbox view
  const downloadUrls: Record<string, string> = {}; // original quality with download flag

  // Track the longest expiry so the client knows when to refresh
  let expiresAtMs = 0;

  const cloudinaryExpiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour for Cloudinary
  const storageExpiresIn = 86400; // 24 hours for Supabase Storage

  for (const photo of photos || []) {
    if (photo.storage_path) {
      // New Supabase Storage photo — three URLs: thumbnail, full view, download
      const [thumbResult, fullResult] = await Promise.all([
        serviceClient.storage.from("deliveries").createSignedUrl(photo.storage_path, storageExpiresIn, {
          transform: { width: 600, height: 600, resize: "cover", quality: 80 },
        }),
        serviceClient.storage.from("deliveries").createSignedUrl(photo.storage_path, storageExpiresIn),
      ]);

      if (thumbResult.data?.signedUrl) {
        signedUrls[photo.id] = thumbResult.data.signedUrl;
        const expiryMs = Date.now() + storageExpiresIn * 1000;
        if (expiryMs > expiresAtMs) expiresAtMs = expiryMs;
      }
      if (fullResult.data?.signedUrl) {
        fullUrls[photo.id] = fullResult.data.signedUrl;
      }
      // Proxy route strips EXIF before delivery; never expose raw storage paths
      downloadUrls[photo.id] = `/api/deliveries/${deliveryId}/download/${photo.id}`;
    } else if (photo.cloudinary_url) {
      // Legacy Cloudinary photo — existing logic unchanged; full res for both grid and lightbox
      const publicId = photo.cloudinary_public_id || extractPublicId(photo.cloudinary_url);
      const type = photo.cloudinary_public_id ? "authenticated" : "upload";

      const viewUrl = cloudinary.url(publicId, {
        sign_url: true,
        type,
        expires_at: cloudinaryExpiresAt,
        secure: true,
      });
      signedUrls[photo.id] = viewUrl;
      fullUrls[photo.id] = viewUrl;

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
    fullUrls,
    downloadUrls,
    expiresAt: new Date(expiresAtMs).toISOString(),
  });
}
