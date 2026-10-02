 import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";

const CandidateApplicationSchema = new mongoose.Schema(
  {
    candidateId: String,
    email: { type: String, required: true, lowercase: true },
    fullName: String,

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    await dbConnect();

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email).toLowerCase();

    const application = await CandidateApplication.findOne({
      email: decodedEmail,
    });

    if (!application) {
      return NextResponse.json({
        exists: false,
      });
    }

    return NextResponse.json({
      exists: true,
      application,
    });
  } catch (error) {
    console.error("Candidate application fetch error:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}