import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";

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

  const { deliveryId, photoId } = typeof params?.then === "function"
    ? await params
    : params;

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: delivery } = await serviceClient
    .from("photo_deliveries")
    .select("photographer_id, client_id")
    .eq("id", deliveryId)
    .single();

  if (!delivery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (delivery.photographer_id !== user.id && delivery.client_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // photo must belong to THIS delivery — prevents cross-delivery access by guessing photo IDs
  const { data: photo } = await serviceClient
    .from("delivered_photos")
    .select("storage_path, filename")
    .eq("id", photoId)
    .eq("delivery_id", deliveryId)
    .single();

  if (!photo?.storage_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: fileData, error: dlError } = await serviceClient.storage
    .from("deliveries")
    .download(photo.storage_path);

  if (dlError || !fileData) {
    console.error("[download-proxy] storage download error:", dlError?.message);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const meta = await sharp(buffer).metadata();

  // Strip all EXIF (GPS, camera serial, device info) by re-encoding through Sharp.
  // Sharp drops metadata by default; no .withMetadata() call means a clean output.
  let stripped: Buffer;
  let contentType: string;

  switch (meta.format) {
    case "jpeg":
      stripped = await sharp(buffer).jpeg({ quality: 95 }).toBuffer();
      contentType = "image/jpeg";
      break;
    case "png":
      stripped = await sharp(buffer).png().toBuffer();
      contentType = "image/png";
      break;
    case "webp":
      stripped = await sharp(buffer).webp({ quality: 95 }).toBuffer();
      contentType = "image/webp";
      break;
    case "tiff":
      stripped = await sharp(buffer).tiff({ quality: 95 }).toBuffer();
      contentType = "image/tiff";
      break;
    default:
      stripped = await sharp(buffer).jpeg({ quality: 95 }).toBuffer();
      contentType = "image/jpeg";
  }

  const safeFilename = (photo.filename || `photo-${photoId}.jpg`).replace(/[^\w.\-]/g, "_");
  const encodedFilename = encodeURIComponent(safeFilename);

  return new NextResponse(new Uint8Array(stripped), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "private, no-store",
      "Content-Length": String(stripped.length),
    },
  });
}
