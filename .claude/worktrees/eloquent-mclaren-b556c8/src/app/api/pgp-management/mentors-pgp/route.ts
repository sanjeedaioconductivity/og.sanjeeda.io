import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";

const MentorUserSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    education: { type: String, trim: true },
    expertise: { type: String, trim: true },
    phone: { type: String, trim: true },
    // Kept in sync with the mentor auth route's schema so login queries keep
    // `password` regardless of which route registers the model first.
    password: String,
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
  mongoose.models.MentorUser ||
  mongoose.model("MentorUser", MentorUserSchema);

export async function GET() {
  try {
    await dbConnect();

    const mentors = await MentorUser.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      totalMentors: mentors.length,
      mentors: mentors.map((mentor) => ({
        mentorId: String(mentor._id),
        fullName: mentor.fullName || "",
        email: mentor.email || "",
        education: mentor.education || "",
        expertise: mentor.expertise || "",
        phone: mentor.phone || "",
        role: mentor.role || "Mentor",
        status: mentor.status || "Approved",
        createdAt: mentor.createdAt,
      })),
    });
  } catch (error) {
    console.error("Mentors Fetch Error:", error);

    return NextResponse.json(
      { message: "Failed to fetch mentor records." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { message: "Mentor email is required." },
        { status: 400 }
      );
    }

    const updatedMentor = await MentorUser.findOneAndUpdate(
      { email: body.email.toLowerCase() },
      {
        $set: {
          fullName: body.fullName || "",
          email: body.email.toLowerCase(),
          education: body.education || "",
          expertise: body.expertise || "",
          phone: body.phone || "",
          status: body.status || "Approved",
        },
      },
      { new: true }
    );

    if (!updatedMentor) {
      return NextResponse.json(
        { message: "Mentor not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Mentor information updated successfully.",
      mentor: updatedMentor,
    });
  } catch (error) {
    console.error("Mentor Update Error:", error);

    return NextResponse.json(
      { message: "Failed to update mentor information." },
      { status: 500 }
    );
  }
}