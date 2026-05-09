import twilio from "twilio";

export async function sendSms(to: string | null | undefined, body: string): Promise<void> {
  if (!to) return;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) return;
  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body, from, to });
  } catch {
    // fail silently — SMS is best-effort
  }
}
