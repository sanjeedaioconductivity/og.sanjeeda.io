import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";

const CandidateApplicationSchema = new mongoose.Schema(
  {
    candidateId: { type: String },
    email: { type: String, required: true, lowercase: true },
    fullName: { type: String, required: true },

    guardianName: String,
    gender: String,
    nationality: String,
    cnic: String,
    dob: String,
    address: String,
    contactNumber: String,

    qualification: String,
    recentJobTitleYear: String,
    expectations: String,
    laptopAvailable: String,
    internetConnection: String,

    confirmation: Boolean,
    termsAgreement: Boolean,
  },
  { timestamps: true }
);

const CandidateApplication =
  mongoose.models.CandidateApplication ||
  mongoose.model("CandidateApplication", CandidateApplicationSchema);

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    if (!body.email || !body.fullName) {
      return NextResponse.json(
        { message: "Email and full name are required." },
        { status: 400 }
      );
    }

    const application = await CandidateApplication.findOneAndUpdate(
      { email: body.email.toLowerCase() },
      body,
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: "Application saved successfully.",
      application,
    });
  } catch (error) {
    console.error("Candidate Application Save Error:", error);
    return NextResponse.json(
      { message: "Application save failed." },
      { status: 500 }
    );
  }
}