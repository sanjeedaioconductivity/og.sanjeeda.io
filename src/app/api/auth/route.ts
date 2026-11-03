import { db } from "@/utils/mysql";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { clearPortalCookie, setPortalCookie } from "@/lib/offerguide/identity";
import { userIdOf } from "@/lib/portal/users";
import { createPortalToken } from "@/lib/portal/token";

const googleClient = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
);

type AuthAction =
  | "login"
  | "signup"
  | "google-login"
  | "google-token"
  | "logout"
  | "send-code"
  | "verify-code";

type UserRow = RowDataPacket & {
  /** `sanjeedausers` primary key. Read it with userIdOf() — the column name varies. */
  user_id?: number;
  id?: number;
  name: string;
  email: string;
  password?: string | null;
  google_id?: string | null;
  reset_code_expiry?: Date | string | null;
};

type ExistingUserRow = RowDataPacket & {
  email: string;
};

type ResetCodeRow = RowDataPacket & {
  reset_code_expiry: Date | string;
};

type AuthRequestBody = {
  action?: AuthAction;
  name?: string;
  email?: string;
  password?: string;
  credential?: string;
  /** OAuth access token from the Google popup flow ("google-token"). */
  accessToken?: string;
  code?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

/** One definition of the portal JWT, shared with the LinkedIn and OTP routes. */
const createToken = createPortalToken;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AuthRequestBody;
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { message: "Auth action is required" },
        { status: 400 }
      );
    }

    if (action === "signup") {
      return await handleSignup(body);
    }

    if (action === "login") {
      return await handleLogin(body);
    }

    if (action === "google-login") {
      return await handleGoogleLogin(body);
    }

    if (action === "google-token") {
      return await handleGoogleToken(body);
    }

    if (action === "logout") {
      return handleLogout();
    }

    if (action === "send-code") {
      return await handleSendCode(body);
    }

    if (action === "verify-code") {
      return await handleVerifyCode(body);
    }

    return NextResponse.json(
      { message: "Invalid auth action" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("AUTH API ERROR:", error);

    return NextResponse.json(
      {
        message: "Auth request failed",
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

async function handleSignup(body: AuthRequestBody) {
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { message: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const normalizedName = String(name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  const [existing] = await db.execute<ExistingUserRow[]>(
    "SELECT email FROM SanjeedaUsers WHERE email = ?",
    [normalizedEmail]
  );

  if (existing.length > 0) {
    return NextResponse.json(
      { message: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO SanjeedaUsers (name, email, password) VALUES (?, ?, ?)",
    [normalizedName, normalizedEmail, password]
  );

  const token = createToken({
    id: result.insertId,
    name: normalizedName,
    email: normalizedEmail,
  });

  const response = NextResponse.json(
    {
      message: "User registered successfully!",
      token,
      user: {
        id: result.insertId,
        name: normalizedName,
        email: normalizedEmail,
      },
    },
    { status: 201 }
  );
  setPortalCookie(response, token);
  return response;
}

async function handleLogin(body: AuthRequestBody) {
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const [rows] = await db.execute<UserRow[]>(
    "SELECT * FROM SanjeedaUsers WHERE email = ?",
    [normalizedEmail]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  const user = rows[0];

  if (user.password !== password) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const userId = userIdOf(user);
  if (userId === null) {
    // A row with no readable primary key would mint a claimless token — the
    // exact failure this sprint exists to close. Fail loudly instead.
    console.error("AUTH: sanjeedausers row has no readable id column", {
      columns: Object.keys(user),
    });
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }

  const token = createToken({
    id: userId,
    name: user.name,
    email: user.email,
  });

  const response = NextResponse.json(
    {
      message: "Login successful!",
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    },
    { status: 200 }
  );
  setPortalCookie(response, token);
  return response;
}

async function handleGoogleLogin(body: AuthRequestBody) {
  const { credential } = body;

  if (!credential) {
    return NextResponse.json(
      { message: "Google credential is required" },
      { status: 400 }
    );
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    return NextResponse.json(
      { message: "Unable to get Google user email" },
      { status: 400 }
    );
  }

  return completeGoogleSignIn(payload.name || "Google User", payload.email, payload.sub);
}

/**
 * Google sign-in from the popup (token) flow, used by custom-styled buttons that
 * can't be Google's own rendered button (e.g. full-width ones).
 *
 * The browser holds an ACCESS token, not an ID token, so it is verified against
 * Google before anything is trusted: tokeninfo must say it was issued to OUR
 * client id (otherwise a token minted for any other app could be replayed here)
 * and that the email is verified. Then the same account logic as google-login.
 */
async function handleGoogleToken(body: AuthRequestBody) {
  const token = body.accessToken;
  if (!token) {
    return NextResponse.json({ message: "Google access token is required" }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const infoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  if (!infoRes.ok) {
    return NextResponse.json({ message: "Invalid Google token" }, { status: 401 });
  }
  const info = (await infoRes.json()) as { aud?: string; azp?: string; email?: string; email_verified?: string | boolean; sub?: string };
  if (!clientId || (info.aud !== clientId && info.azp !== clientId)) {
    return NextResponse.json({ message: "Google token was not issued for this site" }, { status: 401 });
  }
  if (!info.email || String(info.email_verified) !== "true") {
    return NextResponse.json({ message: "Google account email is not verified" }, { status: 400 });
  }

  // tokeninfo has no display name; userinfo does.
  let name = "Google User";
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (userRes.ok) name = ((await userRes.json()) as { name?: string }).name || name;
  } catch {
    /* name is cosmetic; the verified email above is what matters */
  }

  return completeGoogleSignIn(name, info.email, info.sub);
}

/** Shared by both Google flows: find or create the user, issue the session. */
async function completeGoogleSignIn(rawName: string, rawEmail: string, googleId: string | undefined) {
  const name = rawName;
  const email = String(rawEmail).trim().toLowerCase();

  const [rows] = await db.execute<UserRow[]>(
    "SELECT * FROM SanjeedaUsers WHERE email = ?",
    [email]
  );

  let userId: number;
  let userName = name;
  const isExistingUser = rows.length > 0;

  if (isExistingUser) {
    const existingUser = rows[0];

    const existingId = userIdOf(existingUser);
    if (existingId === null) {
      console.error("AUTH: sanjeedausers row has no readable id column", {
        columns: Object.keys(existingUser),
      });
      return NextResponse.json(
        { message: "Google authentication failed" },
        { status: 500 }
      );
    }

    userId = existingId;
    userName = existingUser.name || name;

    if (!existingUser.google_id && googleId) {
      await db.execute(
        "UPDATE SanjeedaUsers SET google_id = ? WHERE email = ?",
        [googleId, email]
      );
    }
  } else {
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO SanjeedaUsers (name, email, google_id) VALUES (?, ?, ?)",
      // mysql2 rejects undefined binds; tokeninfo normally carries sub, but be safe.
      [name, email, googleId ?? null]
    );

    userId = result.insertId;
  }

  const token = createToken({
    id: userId,
    name: userName,
    email,
  });

  const response = NextResponse.json(
    {
      message: isExistingUser
        ? "Login successful!"
        : "User registered via Google!",
      token,
      email,
      user: {
        id: userId,
        name: userName,
        email,
        google_id: googleId,
      },
    },
    { status: 200 }
  );
  setPortalCookie(response, token);
  return response;
}

/**
 * The portal had no logout at all before Sprint 9 — the JWT was written to
 * localStorage and simply left there. Clearing the cookie server-side is the
 * half that matters; the client clears its own localStorage copy alongside.
 *
 * Unconditionally 200: logging out when already logged out is the desired end
 * state, not an error.
 */
function handleLogout() {
  const response = NextResponse.json(
    { message: "Logged out" },
    { status: 200 }
  );
  clearPortalCookie(response);
  return response;
}

async function handleSendCode(body: AuthRequestBody) {
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { message: "Email is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

  if (!EMAIL_USER || !EMAIL_PASS) {
    return NextResponse.json(
      { message: "Email configuration is missing" },
      { status: 500 }
    );
  }

  const [rows] = await db.execute<ExistingUserRow[]>(
    "SELECT email FROM SanjeedaUsers WHERE email = ?",
    [normalizedEmail]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  const resetLink = `${BASE_URL}/auth`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Support" <${EMAIL_USER}>`,
    to: normalizedEmail,
    subject: "Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2>Password Reset Code</h2>
        <p>Hello,</p>
        <p>Your password reset code is:</p>
        <h1 style="letter-spacing: 4px; color: #dc2626;">${code}</h1>
        <p>This code expires in 10 minutes.</p>
        <p style="margin-top: 20px;">Open reset page:</p>
        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #dc2626;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 10px;
          "
        >
          Open Reset Password Page
        </a>
      </div>
    `,
  });

  await db.execute(
    "UPDATE SanjeedaUsers SET reset_code = ?, reset_code_expiry = ? WHERE email = ?",
    [code, expiry, normalizedEmail]
  );

  return NextResponse.json(
    { message: "Code sent successfully" },
    { status: 200 }
  );
}

async function handleVerifyCode(body: AuthRequestBody) {
  const { email, code, password } = body;

  if (!email || !code || !password) {
    return NextResponse.json(
      { message: "Email, code, and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const [rows] = await db.execute<ResetCodeRow[]>(
    "SELECT reset_code_expiry FROM SanjeedaUsers WHERE email = ? AND reset_code = ?",
    [normalizedEmail, code]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { message: "Invalid email or code" },
      { status: 400 }
    );
  }

  if (new Date(rows[0].reset_code_expiry) < new Date()) {
    return NextResponse.json(
      { message: "Reset code expired" },
      { status: 400 }
    );
  }

  await db.execute(
    "UPDATE SanjeedaUsers SET password = ?, reset_code = NULL, reset_code_expiry = NULL WHERE email = ?",
    [password, normalizedEmail]
  );

  return NextResponse.json(
    { message: "Password reset successfully!" },
    { status: 200 }
  );
}