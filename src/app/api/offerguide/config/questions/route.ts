import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgQuestions } from "@/lib/db/mongo/models/index.js";
import { badRequest } from "@/lib/offerguide/errors";

type QuestionDoc = {
  fieldId: string;
  screen: string;
  label: string;
  helpText: string;
  uiControl: string;
  options?: { value: string; sortOrder: number; active?: boolean }[];
};

export async function GET(req: NextRequest) {
  const screen = req.nextUrl.searchParams.get("screen");
  if (!screen) return badRequest("screen query parameter is required.");

  await dbConnect();
  const questions = await OgQuestions.find({ screen, active: true })
    .sort({ sortOrder: 1 })
    .lean<QuestionDoc[]>();

  // Client-safe projection — deliberately excludes score/yesNoScores/ratingMultiplier
  // and options[].active, so a candidate can't reverse-engineer scoring from the
  // network response.
  const publicShape = questions.map((q) => ({
    fieldId: q.fieldId,
    screen: q.screen,
    label: q.label,
    helpText: q.helpText,
    uiControl: q.uiControl,
    options: (q.options ?? [])
      .filter((opt) => opt.active !== false)
      .map((opt) => ({ value: opt.value, sortOrder: opt.sortOrder })),
  }));

  return NextResponse.json(publicShape);
}
