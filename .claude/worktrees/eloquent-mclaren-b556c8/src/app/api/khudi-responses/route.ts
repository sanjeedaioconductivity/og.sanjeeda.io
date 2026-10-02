// src/app/api/responses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import mongoose from 'mongoose';

const PersonalityTest =
  mongoose.models.PersonalityTest ||
  mongoose.model(
    'PersonalityTest',
    new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      age: String,

      likertResponses: [],
      forcedResponses: [],
      sjtResponses: [],

      history: [
        {
          oldName: String,
          oldEmail: String,
          oldAge: String,
          changedAt: { type: Date, default: Date.now },
        },
      ],

      timestamp: { type: Date, default: Date.now },
    })
  );

type LikertResponse = {
  questionId: string;
  responseText: string;
  responseValue: number;
};

type ForcedResponse = {
  questionId: string;
  optionKey: string;
};

type SjtResponse = {
  questionId: string;
  optionKey: string;
};

type CandidateDoc = {
  likertResponses?: LikertResponse[];
  forcedResponses?: ForcedResponse[];
  sjtResponses?: SjtResponse[];
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
}

// GET /api/responses
// Fetch all saved responses in flattened format
export async function GET() {
  try {
    await dbConnect();

    const allDocs = await PersonalityTest.find({});

    const likertFlat = allDocs.flatMap((doc: CandidateDoc) =>
      (doc.likertResponses || []).map((resp: LikertResponse) => ({
        type: 'likert',
        questionId: resp.questionId,
        responseText: resp.responseText,
        responseValue: resp.responseValue,
      }))
    );

    const forcedFlat = allDocs.flatMap((doc: CandidateDoc) =>
      (doc.forcedResponses || []).map((resp: ForcedResponse) => ({
        type: 'forced',
        questionId: resp.questionId,
        optionKey: resp.optionKey,
      }))
    );

    const sjtFlat = allDocs.flatMap((doc: CandidateDoc) =>
      (doc.sjtResponses || []).map((resp: SjtResponse) => ({
        type: 'sjt',
        questionId: resp.questionId,
        optionKey: resp.optionKey,
      }))
    );

    const full = [...likertFlat, ...forcedFlat, ...sjtFlat];

    const sorted = full.sort((a, b) =>
      a.questionId.localeCompare(b.questionId)
    );

    return NextResponse.json({
      success: true,
      responses: sorted,
    });
  } catch (error: unknown) {
    console.error('Fetch Responses Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/responses
// Save or update candidate responses
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const {
      name,
      email,
      age,
      likertResponses,
      forcedResponses,
      sjtResponses,
    } = await req.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    let candidate = await PersonalityTest.findOne({
      email: normalizedEmail,
    });

    if (!candidate) {
      candidate = new PersonalityTest({
        name,
        email: normalizedEmail,
        age,
        likertResponses: likertResponses || [],
        forcedResponses: forcedResponses || [],
        sjtResponses: sjtResponses || [],
        timestamp: new Date(),
      });
    } else {
      candidate.name = name;
      candidate.age = age;
      candidate.likertResponses = likertResponses || [];
      candidate.forcedResponses = forcedResponses || [];
      candidate.sjtResponses = sjtResponses || [];
      candidate.timestamp = new Date();
    }

    await candidate.save();

    return NextResponse.json({
      success: true,
      message: 'Candidate responses saved successfully',
      candidate,
    });
  } catch (error: unknown) {
    console.error('Save Responses Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}