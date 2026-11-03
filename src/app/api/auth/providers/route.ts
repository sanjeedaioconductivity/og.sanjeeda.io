import { NextResponse } from "next/server";
import { linkedInConfigured } from "@/lib/portal/linkedin";
import { otpConfigured } from "@/lib/portal/otp";

/**
 * GET /api/auth/providers — which optional sign-in methods this deployment has
 * keys for. Lets sign-up pages say "not available yet" up front instead of
 * failing after a click. Booleans only; never exposes a key.
 */
export function GET() {
  return NextResponse.json(
    {
      google: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      linkedin: linkedInConfigured(),
      otp: otpConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
