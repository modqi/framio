import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    const type = (data.get("type") as string) || "portfolio";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, GIF, and HEIC images are allowed." }, { status: 400 });
    }

    const MAX_BYTES = type === "delivery" ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large. Maximum size is ${type === "delivery" ? "50" : "20"} MB.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isMessage = type === "message";
    const isDelivery = type === "delivery";
    const isProfile = type === "profile";
    const folder = isDelivery ? "frameyou/deliveries" : isMessage ? "frameyou/messages" : isProfile ? "frameyou/profiles" : "frameyou/portfolios";
    const transformation = isDelivery
      ? [{ width: 4000, crop: "limit" }, { quality: 95 }, { fetch_format: "auto" }]
      : isMessage
      ? [{ width: 1200, crop: "limit" }, { quality: 85 }, { fetch_format: "auto" }]
      : isProfile
      ? [{ width: 800, height: 800, crop: "fill", gravity: "face" }, { quality: "auto" }, { fetch_format: "auto" }]
      : [{ width: 1200, height: 1600, crop: "limit" }, { quality: "auto" }, { fetch_format: "auto" }];

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "image", folder, transformation },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const uploadResult = result as any;
    return NextResponse.json({ url: uploadResult.secure_url });

  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}