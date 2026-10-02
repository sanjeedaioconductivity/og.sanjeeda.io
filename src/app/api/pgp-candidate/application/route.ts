import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import CandidateApplication from "@/models/CandidateApplication";

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