import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: String,
  type: String,
  primaryTrait: String,
  text: String,
  textTranslation: String,

  formatWeight: Number,
  traitWeight: Number,
  sectionWeight: Number,

  sectionA: [String],
  sectionB: [String],

  reverse: Boolean,
  skills: [String],

  options: [
    {
      label: String,
      value: Number,
    },
  ],

  answers: [
    {
      id: String,
      optionKey: String,
      text: String,
      textTranslation: String,
      scores: mongoose.Schema.Types.Mixed,
      baseScoreValue: Number,
      primaryTraitOverride: String,
    },
  ],
});

const Question =
  mongoose.models.Question || mongoose.model('Question', QuestionSchema);

type LikertScaleValue = 1 | 2 | 3 | 4 | 5;

type LikertAnswer = {
  id: string;
  value: LikertScaleValue;
  scores: Record<string, number>;
  baseScoreValue: number;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
}

function createLikertAnswers(
  skills: string[] = [],
  reverse: boolean = false
): LikertAnswer[] {
  const scale: Record<LikertScaleValue, number> = reverse
    ? { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 }
    : { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };

  return Array.from({ length: 5 }, (_, i): LikertAnswer => {
    const value = (i + 1) as LikertScaleValue;

    const scores: Record<string, number> = {};

    skills.forEach((skill: string) => {
      scores[skill] = scale[value];
    });

    return {
      id: `likert-${value}`,
      value,
      scores,
      baseScoreValue: scale[value],
    };
  });
}

// GET /api/questions
// List questions
export async function GET() {
  try {
    await dbConnect();

    const questions = await Question.find({});

    const enriched = questions.map((q) => {
      const obj = q.toObject();

      if (q.type === 'likert') {
        obj.answers = createLikertAnswers(q.skills, q.reverse);
      }

      return obj;
    });

    return NextResponse.json({
      success: true,
      questions: enriched,
    });
  } catch (error: unknown) {
    console.error('Fetch Questions Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/questions
// Add questions
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { questions } = await req.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No questions provided',
        },
        { status: 400 }
      );
    }

    await Question.insertMany(questions);

    return NextResponse.json({
      success: true,
      message: 'Questions added',
    });
  } catch (error: unknown) {
    console.error('Add Questions Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}