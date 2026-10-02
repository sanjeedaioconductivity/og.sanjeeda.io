import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";

const CandidateUserSchema = new mongoose.Schema(
  {
    fullName: String,
    email: { type: String, lowercase: true },
    // Kept in sync with the auth route's schema: this model may register first
    // (e.g. when the dashboard loads candidates before anyone logs in), and a
    // missing path here would drop `password` from login queries.
    password: String,
    role: String,
    status: String,
  },
  { timestamps: true }
);

const CandidateApplicationSchema = new mongoose.Schema(
  {
    candidateId: String,
    email: { type: String, lowercase: true },
    fullName: String,
    gender: String,
    nationality: String,
    cnic: String,
    dob: String,
    contactNumber: String,
    address: String,
    guardianName: String,
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

const CandidateUser =
  mongoose.models.CandidateUser ||
  mongoose.model("CandidateUser", CandidateUserSchema);

const CandidateApplication =
  mongoose.models.CandidateApplication ||
  mongoose.model("CandidateApplication", CandidateApplicationSchema);

export async function GET() {
  try {
    await dbConnect();

    const users = await CandidateUser.find().sort({ createdAt: -1 }).lean();
    const applications = await CandidateApplication.find().lean();

    const mergedCandidates = users.map((user) => {
      const application = applications.find(
        (app) => app.email?.toLowerCase() === user.email?.toLowerCase()
      );

      return {
        candidateId: String(user._id),
        fullName: user.fullName || application?.fullName || "",
        email: user.email || application?.email || "",
        status: user.status || "Approved",
        applicationStatus: application ? "Submitted" : "Pending",
        gender: application?.gender || "",
        nationality: application?.nationality || "",
        cnic: application?.cnic || "",
        dob: application?.dob || "",
        contactNumber: application?.contactNumber || "",
        address: application?.address || "",
        guardianName: application?.guardianName || "",
        qualification: application?.qualification || "",
        recentJobTitleYear: application?.recentJobTitleYear || "",
        expectations: application?.expectations || "",
        laptopAvailable: application?.laptopAvailable || "",
        internetConnection: application?.internetConnection || "",
        confirmation: application?.confirmation || false,
        createdAt: application?.createdAt || user.createdAt,
      };
    });

    return NextResponse.json({ candidates: mergedCandidates });
  } catch (error) {
    console.error("PGP Candidates Fetch Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch candidate records." },
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
        { message: "Candidate email is required." },
        { status: 400 }
      );
    }

    const updatedApplication = await CandidateApplication.findOneAndUpdate(
      { email: body.email.toLowerCase() },
      {
        $set: {
          email: body.email.toLowerCase(),
          fullName: body.fullName || "",
          gender: body.gender || "",
          nationality: body.nationality || "",
          cnic: body.cnic || "",
          dob: body.dob || "",
          contactNumber: body.contactNumber || "",
          address: body.address || "",
          guardianName: body.guardianName || "",
          qualification: body.qualification || "",
          recentJobTitleYear: body.recentJobTitleYear || "",
          expectations: body.expectations || "",
          laptopAvailable: body.laptopAvailable || "",
          internetConnection: body.internetConnection || "",
          confirmation: body.confirmation || false,
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: "Candidate profile updated successfully.",
      application: updatedApplication,
    });
  } 
  
    catch (error) {
    console.error("Candidate Update Error:", error);
    return NextResponse.json(
      { message: "Failed to update candidate profile." },
      { status: 500 }
    );
  }
}