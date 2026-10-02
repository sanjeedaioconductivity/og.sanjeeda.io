import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import CandidateApplication from "@/models/CandidateApplication";

interface WeeklyScheduleItem {
  week?: string;
}

interface PGPProgramType {
  programName?: string;
  weeklySchedule?: WeeklyScheduleItem[];
}

interface AttendanceType {
  programId?: string;
  programName?: string;
  candidateEmail?: string;
  candidateName?: string;
  week?: string;
  status?: string;
  markedById?: string;
  markedByName?: string;
}

const WeeklyScheduleSchema =
  new mongoose.Schema<WeeklyScheduleItem>(
    {
      week: {
        type: String,
        default: "",
      },
    },
    {
      _id: false,
      strict: false,
    }
  );

const ProgramSchema = new mongoose.Schema<PGPProgramType>(
  {
    programName: {
      type: String,
      default: "",
    },

    weeklySchedule: {
      type: [WeeklyScheduleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const AttendanceSchema = new mongoose.Schema<AttendanceType>(
  {
    programId: String,
    programName: String,

    candidateEmail: {
      type: String,
      lowercase: true,
    },

    candidateName: String,
    week: String,
    status: String,

    markedById: String,
    markedByName: String,
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index(
  {
    programId: 1,
    candidateEmail: 1,
    week: 1,
  },
  {
    unique: true,
  }
);

const PGPProgram =
  (mongoose.models.PGPProgram as
    | mongoose.Model<PGPProgramType>
    | undefined) ??
  mongoose.model<PGPProgramType>(
    "PGPProgram",
    ProgramSchema
  );

const Attendance =
  (mongoose.models.Attendance as
    | mongoose.Model<AttendanceType>
    | undefined) ??
  mongoose.model<AttendanceType>(
    "Attendance",
    AttendanceSchema
  );

function weekNo(value: string) {
  const match = /(\d+)/.exec(value || "");

  return match
    ? Number(match[1])
    : Number.MAX_SAFE_INTEGER;
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          message: "Invalid program id.",
        },
        {
          status: 400,
        }
      );
    }

    const program = await PGPProgram.findById(id)
      .lean()
      .exec();

    if (!program) {
      return NextResponse.json(
        {
          message: "Program not found.",
        },
        {
          status: 404,
        }
      );
    }

    const weeks = Array.from(
      new Set(
        (program.weeklySchedule ?? [])
          .map((item) => item.week)
          .filter(
            (week): week is string =>
              Boolean(week)
          )
      )
    ).sort(
      (a, b) =>
        weekNo(a) - weekNo(b)
    );

    const students =
      await CandidateApplication.find({
        assignedProgramId: id,
      })
        .select("fullName email")
        .sort({
          fullName: 1,
        })
        .lean();

    const records = await Attendance.find({
      programId: id,
    })
      .select(
        "candidateEmail week status"
      )
      .lean();

    return NextResponse.json({
      weeks,

      students: students.map((student) => ({
        fullName:
          student.fullName || "",

        email:
          student.email || "",
      })),

      records: records.map((record) => ({
        candidateEmail:
          record.candidateEmail || "",

        week:
          record.week || "",

        status:
          record.status || "",
      })),
    });
  } catch (error) {
    console.error(
      "Attendance GET Error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to load attendance.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          message: "Invalid program id.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const candidateEmail = String(
      body.candidateEmail || ""
    )
      .trim()
      .toLowerCase();

    const week = String(
      body.week || ""
    ).trim();

    const status = String(
      body.status || ""
    ).trim();

    if (!candidateEmail || !week) {
      return NextResponse.json(
        {
          message:
            "Candidate and week are required.",
        },
        {
          status: 400,
        }
      );
    }

    const program =
      await PGPProgram.findById(id)
        .select("programName")
        .lean()
        .exec();

    if (!program) {
      return NextResponse.json(
        {
          message: "Program not found.",
        },
        {
          status: 404,
        }
      );
    }

    const programName =
      program.programName || "";

    await Attendance.findOneAndUpdate(
      {
        programId: id,
        candidateEmail,
        week,
      },
      {
        $set: {
          programId: id,
          programName,

          candidateEmail,

          candidateName:
            body.candidateName || "",

          week,
          status,

          markedById:
            body.markedById || "",

          markedByName:
            body.markedByName || "",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json({
      message: "Attendance saved.",
    });
  } catch (error) {
    console.error(
      "Attendance POST Error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to save attendance.",
      },
      {
        status: 500,
      }
    );
  }
}