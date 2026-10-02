import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";

const MentorUserSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    education: { type: String, trim: true },
    expertise: { type: String, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "Mentor" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Blocked"],
      default: "Approved",
    },
  },
  { timestamps: true }
);

const MentorUser =
  mongoose.models.MentorUser || mongoose.model("MentorUser", MentorUserSchema);

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { action } = body;

    if (action === "signup") {
      const { fullName, email, education, expertise, phone, password } = body;

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
        fullName,
        email: email.toLowerCase(),
        education: education || "",
        expertise: expertise || "",
        phone: phone || "",
        password: hashedPassword,
        role: "Mentor",
        status: "Approved",
      });

      return NextResponse.json(
        {
          message: "Mentor account created successfully.",
          userId: user._id,
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

      if (user.status !== "Approved") {
        return NextResponse.json(
          { message: "Account is not approved." },
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

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Mentor Auth Error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}