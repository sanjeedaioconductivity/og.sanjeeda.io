import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import CandidateApplication from "@/models/CandidateApplication";

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