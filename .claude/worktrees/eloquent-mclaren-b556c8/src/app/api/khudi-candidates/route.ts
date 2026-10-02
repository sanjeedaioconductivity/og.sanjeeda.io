import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import mongoose from 'mongoose';

const PersonalityTestSchema = new mongoose.Schema({
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
});

const PersonalityTest =
  mongoose.models.PersonalityTest ||
  mongoose.model('PersonalityTest', PersonalityTestSchema);

// GET → check by email, oldEmail, or fetch all
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const oldEmail = searchParams.get('oldEmail');

    if (oldEmail) {
      const candidate = await PersonalityTest.findOne({ email: oldEmail });

      if (candidate) {
        return NextResponse.json({ exists: true, candidate });
      }

      return NextResponse.json({ exists: false });
    }

    if (email) {
      const candidate = await PersonalityTest.findOne({ email });

      if (candidate) {
        return NextResponse.json({ exists: true, candidate });
      }

      return NextResponse.json({ exists: false });
    }

    const candidates = await PersonalityTest.find(
      {},
      { name: 1, email: 1, age: 1, history: 1, timestamp: 1, _id: 0 }
    );

    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    console.error('Error in GET:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

// POST → create new candidate
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { name, email, age } = await req.json();

    const candidate = new PersonalityTest({
      name,
      email,
      age,
      timestamp: new Date(),
    });

    await candidate.save();

    return NextResponse.json({
      success: true,
      message: 'Candidate saved',
      candidate,
    });
  } catch (error) {
    console.error('POST error:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to save candidate' },
      { status: 500 }
    );
  }
}

// PUT → update existing candidate & track history
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const { oldEmail, name, email, age } = await req.json();

    const candidate = await PersonalityTest.findOne({ email: oldEmail });

    if (!candidate) {
      return NextResponse.json(
        { success: false, message: 'Candidate not found' },
        { status: 404 }
      );
    }

    let updated = false;

    if (
      candidate.name !== name ||
      candidate.email !== email ||
      candidate.age !== age
    ) {
      candidate.history.push({
        oldName: candidate.name,
        oldEmail: candidate.email,
        oldAge: candidate.age,
        changedAt: new Date(),
      });

      updated = true;
    }

    candidate.name = name;
    candidate.email = email;
    candidate.age = age;

    await candidate.save();

    return NextResponse.json({
      success: true,
      updated,
      message: updated
        ? 'Candidate updated with history'
        : 'No changes detected',
      candidate,
    });
  } catch (error) {
    console.error('PUT error:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to update candidate' },
      { status: 500 }
    );
  }
}