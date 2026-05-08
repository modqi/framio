import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { processed: 0, errors: [] as string[] };

  const { data: requests } = await serviceClient
    .from("account_deletion_requests")
    .select("id, user_id, user_email, user_role")
    .eq("status", "pending")
    .lte("scheduled_deletion_at", new Date().toISOString());

  for (const req of requests || []) {
    try {
      const anonSuffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const anonEmail = `deleted_${anonSuffix}@deleted.lomissa.com`;

      if (req.user_role === "photographer") {
        // Anonymise photographer profile row
        await serviceClient
          .from("photographers")
          .update({
            name: "Deleted User",
            bio: null,
            location: null,
            instagram: null,
            website: null,
            profile_photo: null,
          })
          .eq("user_id", req.user_id);

        // Hard-delete portfolio photos
        await serviceClient
          .from("portfolio_photos")
          .delete()
          .eq("photographer_id", req.user_id);

        // Anonymise PII stored on their bookings
        await serviceClient
          .from("bookings")
          .update({ photographer_name: "Deleted User", photographer_email: anonEmail })
          .eq("photographer_id", req.user_id);
      } else {
        // Anonymise client PII stored on their bookings
        await serviceClient
          .from("bookings")
          .update({ client_name: "Deleted User", client_email: anonEmail })
          .eq("client_id", req.user_id);
      }

      // Delete the auth user — cascades to account_deletion_requests via ON DELETE CASCADE
      const { error: deleteError } = await serviceClient.auth.admin.deleteUser(req.user_id);
      if (deleteError) throw new Error(deleteError.message);

      results.processed++;
    } catch (err: any) {
      console.error("[cron/process-deletions] Error for user", req.user_id, err?.message);
      results.errors.push(`${req.user_id}: ${err?.message}`);
    }
  }

  console.log("[cron/process-deletions]", results);
  return NextResponse.json(results);
}
