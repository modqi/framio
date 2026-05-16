import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  client: SupabaseClient,
  entry: {
    action: string;
    actorId?: string | null;
    actorEmail?: string | null;
    bookingId?: string | null;
    amountCents?: number | null;
    currency?: string | null;
    stripeId?: string | null;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await client.from("audit_logs").insert({
      action: entry.action,
      actor_id: entry.actorId ?? null,
      actor_email: entry.actorEmail ?? null,
      booking_id: entry.bookingId ?? null,
      amount_cents: entry.amountCents ?? null,
      currency: entry.currency ?? null,
      stripe_id: entry.stripeId ?? null,
      meta: entry.meta ?? null,
    });
  } catch (err) {
    console.error("[audit]", entry.action, err);
  }
}
