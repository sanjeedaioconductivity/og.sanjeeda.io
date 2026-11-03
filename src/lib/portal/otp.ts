/**
 * Mobile OTP through Twilio Verify. Twilio generates, sends, expires and checks
 * the codes, so no code is ever stored on our side.
 *
 * Needs (twilio.com → Console):
 *   TWILIO_ACCOUNT_SID          starts with "AC"
 *   TWILIO_AUTH_TOKEN           server only
 *   TWILIO_VERIFY_SERVICE_SID   starts with "VA" (Verify → Services → Create)
 *   OTP_DEFAULT_COUNTRY_CODE    optional, default "+92": used for numbers typed
 *                               locally like 0300 1234567
 */

export const PHONE_VERIFIED_COOKIE = "phone_verified";

export function otpConfigured(): boolean {
  return !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN && !!process.env.TWILIO_VERIFY_SERVICE_SID;
}

/**
 * To E.164 ("+923001234567"), or null if it can't be a phone number.
 * "+92 300 1234567", "0092300…" and the local "0300 1234567" all normalise the same.
 */
export function toE164(input: string, defaultCountry = process.env.OTP_DEFAULT_COUNTRY_CODE || "+92"): string | null {
  const trimmed = input.trim();
  let digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (trimmed.startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = defaultCountry.replace(/[^\d]/g, "") + digits.slice(1);
  } else {
    digits = defaultCountry.replace(/[^\d]/g, "") + digits;
  }
  // E.164: up to 15 digits; real mobile numbers are at least 10.
  return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
}

function serviceUrl(path: string): string {
  return `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/${path}`;
}

/** Asks Twilio to text a code. Throws with Twilio's message on failure. */
export async function sendOtp(phone: string): Promise<void> {
  const res = await fetch(serviceUrl("Verifications"), {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Channel: "sms" }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; code?: number };
    throw Object.assign(new Error(body.message || `Twilio returned ${res.status}`), { status: res.status, twilioCode: body.code });
  }
}

/** True only when Twilio reports the code as approved for this number. */
export async function checkOtp(phone: string, code: string): Promise<boolean> {
  const res = await fetch(serviceUrl("VerificationCheck"), {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Code: code }),
    cache: "no-store",
  });
  // 404 = no pending verification (expired, already used or never sent).
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Twilio returned ${res.status}`);
  const body = (await res.json()) as { status?: string };
  return body.status === "approved";
}
