import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dbConnect from "@/utils/dbConnect";

const ManagementUserSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, trim: true },
    department: { type: String, trim: true },

    password: { type: String, required: true },

    role: {
      type: String,
      default: "Management",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Blocked"],
      default: "Approved",
    },

    resetOtp: {
      type: String,
      default: null,
    },

    resetOtpExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const ManagementUser =
  mongoose.models.ManagementUser ||
  mongoose.model("ManagementUser", ManagementUserSchema);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { action } = body;

    if (action === "signup") {
      const { fullName, email, phone, department, password } = body;

      if (!fullName || !email || !password) {
        return NextResponse.json(
          { message: "Full name, email and password are required." },
          { status: 400 }
        );
      }

      const existingUser = await ManagementUser.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email already registered." },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await ManagementUser.create({
        fullName,
        email: email.toLowerCase(),
        phone: phone || "",
        department: department || "",
        password: hashedPassword,
        role: "Management",
        status: "Approved",
      });

      return NextResponse.json(
        {
          message: "Management account created successfully.",
          userId: user._id,
        },
        { status: 201 }
      );
    }

    if (action === "login") {
      const { email, password } = body;

      const user = await ManagementUser.findOne({
        email: email.toLowerCase(),
      });

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

      if (user.status !== "Approved") {
        return NextResponse.json(
          { message: "Account is not approved." },
          { status: 403 }
        );
      }

      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        console.error("Management Auth API Error: JWT_SECRET is not set.");
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

      const response = NextResponse.json({
        message: "Login successful.",
        redirectTo: "/management/dashboard",
      });

      response.cookies.set("management_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    if (action === "forgot-password") {
      const { email } = body;

      const user = await ManagementUser.findOne({
        email: email.toLowerCase(),
      });

      if (!user) {
        return NextResponse.json(
          { message: "No account found with this email." },
          { status: 404 }
        );
      }

      const otp = generateOtp();
      const hashedOtp = await bcrypt.hash(otp, 10);

      user.resetOtp = hashedOtp;
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
        subject: "Sanjeeda.io Management Password Reset OTP",
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      });

      return NextResponse.json({
        message: "OTP sent to your Gmail.",
      });
    }

    if (action === "reset-password") {
      const { email, otp, newPassword } = body;

      const user = await ManagementUser.findOne({
        email: email.toLowerCase(),
      });

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
        return NextResponse.json(
          { message: "Invalid OTP." },
          { status: 400 }
        );
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetOtp = null;
      user.resetOtpExpiry = null;

      await user.save();

      return NextResponse.json({
        message: "Password reset successfully.",
      });
    }

    return NextResponse.json(
      { message: "Invalid action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Management Auth API Error:", error);

    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
}