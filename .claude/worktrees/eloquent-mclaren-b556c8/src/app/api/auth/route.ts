import { db } from "@/utils/mysql";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";

const googleClient = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
);

type AuthAction =
  | "login"
  | "signup"
  | "google-login"
  | "send-code"
  | "verify-code";

type UserRow = RowDataPacket & {
  id: number;
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
  code?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function createToken(user: {
  id: number;
  name: string;
  email: string;
}) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "1h" }
  );
}

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

  return NextResponse.json(
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

  const token = createToken({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json(
    {
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    { status: 200 }
  );
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

  const name = payload.name || "Google User";
  const email = String(payload.email).trim().toLowerCase();
  const googleId = payload.sub;

  const [rows] = await db.execute<UserRow[]>(
    "SELECT * FROM SanjeedaUsers WHERE email = ?",
    [email]
  );

  let userId: number;
  let userName = name;
  const isExistingUser = rows.length > 0;

  if (isExistingUser) {
    const existingUser = rows[0];

    userId = existingUser.id;
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
      [name, email, googleId]
    );

    userId = result.insertId;
  }

  const token = createToken({
    id: userId,
    name: userName,
    email,
  });

  return NextResponse.json(
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