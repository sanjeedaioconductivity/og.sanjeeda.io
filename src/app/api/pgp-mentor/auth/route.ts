import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dbConnect from "@/utils/dbConnect";
import MentorUser, { isMentorActive, normalizeMentorStatus } from "@/models/MentorUser";
import ActivityLog, { ACCOUNT_SECTION } from "@/models/ActivityLog";

/**
 * Mentor authentication for the PGP portal.
 *
 * SIGNUP DOES NOT GRANT ACCESS. A new mentor account is created as `Pending`
 * and the signup is written to the activity log, so the PGP admin sees it on
 * the Monitoring tab with its date. Login is refused until the admin marks the
 * account Active (see /api/pgp-management/mentors-pgp PATCH). Candidates are
 * different — they self-serve — which is why the unified /pgp-access form
 * talks to two routes rather than one.
 */

/** The salutation dropdown on the signup form. Anything else is stored as blank. */
const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr"];

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** What a mentor is told when their account exists but may not sign in. */
function blockedMessage(status: string): string {
  switch (normalizeMentorStatus(status)) {
    case "Pending":
      return "Your mentor account is awaiting approval by the PGP admin. You will be able to sign in once it is marked Active.";
    case "Rejected":
      return "Your mentor application was not approved. Please contact the PGP admin.";
    case "Blocked":
      return "Your mentor account has been blocked. Please contact the PGP admin.";
    default:
      return "Account is not active.";
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { action } = body;

    if (action === "signup") {
      const { title, fullName, email, education, expertise, phone, password } = body;

      if (!fullName || !email || !password) {
        return NextResponse.json(
          { message: "Full name, email and password are required." },
          { status: 400 }
        );
      }

      const existingUser = await MentorUser.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email already registered." },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await MentorUser.create({
        title: TITLES.includes(title) ? title : "",
        fullName,
        email: email.toLowerCase(),
        education: education || "",
        expertise: expertise || "",
        phone: phone || "",
        password: hashedPassword,
        role: "Mentor",
        status: "Pending",
      });

      // The signup itself is the first row of this mentor's audit trail.
      await ActivityLog.create({
        mentorId: user._id.toString(),
        mentorName: user.fullName,
        mentorEmail: user.email,
        section: ACCOUNT_SECTION,
        itemLabel: "Mentor signup",
        fromStatus: "",
        toStatus: "Pending",
      });

      return NextResponse.json(
        {
          message:
            "Mentor account created. It is awaiting approval by the PGP admin — you will be able to sign in once it is marked Active.",
          userId: user._id,
          pendingApproval: true,
        },
        { status: 201 }
      );
    }

    if (action === "login") {
      const { email, password } = body;

      const user = await MentorUser.findOne({ email: email.toLowerCase() });

      if (!user) {
        return NextResponse.json(
          { message: "Invalid email or password." },
          { status: 401 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Invalid email or password." },
          { status: 401 }
        );
      }

      if (!isMentorActive(user.status)) {
        return NextResponse.json(
          { message: blockedMessage(user.status), status: normalizeMentorStatus(user.status) },
          { status: 403 }
        );
      }

      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        console.error("Mentor Auth Error: JWT_SECRET is not set.");
        return NextResponse.json(
          { message: "Server configuration error." },
          { status: 500 }
        );
      }

      const token = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        jwtSecret,
        { expiresIn: "1d" }
      );

      // The admin's notifications are built from this trail, so a sign-in is
      // worth a row of its own.
      await ActivityLog.create({
        mentorId: user._id.toString(),
        mentorName: user.fullName,
        mentorEmail: user.email,
        section: ACCOUNT_SECTION,
        itemLabel: "Mentor signed in",
        fromStatus: "",
        toStatus: "Signed in",
      });

      const response = NextResponse.json({
        message: "Login successful.",
        redirectTo: "/mentor/dashboard",
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          education: user.education,
          expertise: user.expertise,
          phone: user.phone,
          role: user.role,
        },
      });

      response.cookies.set("mentor_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ message: "Logged out." });

      response.cookies.set("mentor_token", "", {
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    if (action === "forgot-password") {
      const { email } = body;

      const user = await MentorUser.findOne({ email: email.toLowerCase() });

      if (!user) {
        return NextResponse.json(
          { message: "No account found with this email." },
          { status: 404 }
        );
      }

      const otp = generateOtp();
      user.resetOtp = await bcrypt.hash(otp, 10);
      user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Sanjeeda.io Mentor Password Reset OTP",
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      });

      return NextResponse.json({ message: "OTP sent to your Gmail." });
    }

    if (action === "reset-password") {
      const { email, otp, newPassword } = body;

      const user = await MentorUser.findOne({ email: email.toLowerCase() });

      if (!user || !user.resetOtp || !user.resetOtpExpiry) {
        return NextResponse.json(
          { message: "Invalid reset request." },
          { status: 400 }
        );
      }

      if (new Date() > user.resetOtpExpiry) {
        return NextResponse.json(
          { message: "OTP expired. Please request again." },
          { status: 400 }
        );
      }

      const isOtpValid = await bcrypt.compare(otp, user.resetOtp);

      if (!isOtpValid) {
        return NextResponse.json({ message: "Invalid OTP." }, { status: 400 });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();

      return NextResponse.json({ message: "Password reset successfully." });
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Mentor Auth Error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
