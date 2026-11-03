import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { checkOtp, otpConfigured, PHONE_VERIFIED_COOKIE, sendOtp, toE164 } from "@/lib/portal/otp";

/**
 * POST /api/auth/otp — verify that a candidate owns a mobile number.
 *
 *   { action: "send",   phone }        → texts a 6-digit code (Twilio Verify)
 *   { action: "verify", phone, code }  → checks it
 *
 * On success it sets an httpOnly `phone_verified` cookie (a signed claim of the
 * number, 30 minutes), so whatever saves the profile next can trust the number
 * was verified rather than taking the browser's word for it.
 *
 * This proves ownership of the number; it does not log anyone in. Logging in BY
 * phone needs a phone column on `sanjeedausers`, which is a schema decision for
 * the identity table and deliberately not made here.
 */

type Body = { action?: "send" | "verify"; phone?: string; code?: string };

// Best-effort throttle on top of Twilio's own limits: one text per number per
// 30 s, in this server instance. Stops a double-click or a script from burning
// SMS credit; Twilio Verify's rate limits are the real backstop.
const lastSent = new Map<string, number>();
const RESEND_MS = 30_000;

export async function POST(req: NextRequest) {
  if (!otpConfigured()) {
    return NextResponse.json({ message: "Mobile OTP is not set up yet.", configured: false }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const phone = toE164(String(body.phone ?? ""));
  if (!phone) {
    return NextResponse.json({ message: "Please enter a valid mobile number, e.g. +92 300 1234567." }, { status: 400 });
  }

  if (body.action === "send") {
    const wait = (lastSent.get(phone) ?? 0) + RESEND_MS - Date.now();
    if (wait > 0) {
      return NextResponse.json(
        { message: `Please wait ${Math.ceil(wait / 1000)} seconds before requesting another code.`, retryAfter: Math.ceil(wait / 1000) },
        { status: 429 }
      );
    }
    try {
      await sendOtp(phone);
      lastSent.set(phone, Date.now());
      return NextResponse.json({ message: "Code sent.", phone });
    } catch (error) {
      const e = error as Error & { twilioCode?: number };
      console.error("OTP: send failed", e.twilioCode, e.message);
      // 60200 invalid number, 60203 max attempts, 60205 landline / SMS not supported.
      const message =
        e.twilioCode === 60203
          ? "Too many codes requested for this number. Please try again later."
          : e.twilioCode === 60200 || e.twilioCode === 60205
            ? "This number can't receive SMS codes. Please check it."
            : "We couldn't send the code right now. Please try again.";
      return NextResponse.json({ message }, { status: 502 });
    }
  }

  if (body.action === "verify") {
    const code = String(body.code ?? "").trim();
    if (!/^\d{4,10}$/.test(code)) {
      return NextResponse.json({ message: "Enter the code from the text message." }, { status: 400 });
    }
    try {
      const ok = await checkOtp(phone, code);
      if (!ok) return NextResponse.json({ message: "That code is incorrect or has expired." }, { status: 400 });
    } catch (error) {
      console.error("OTP: verify failed", error);
      return NextResponse.json({ message: "We couldn't check the code right now. Please try again." }, { status: 502 });
    }
    const response = NextResponse.json({ verified: true, phone });
    response.cookies.set(
      PHONE_VERIFIED_COOKIE,
      jwt.sign({ phone, purpose: "phone_verified" }, process.env.JWT_SECRET || "default_secret", { expiresIn: "30m" }),
      { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 60 }
    );
    return response;
  }

  return NextResponse.json({ message: "Unknown action." }, { status: 400 });
}
