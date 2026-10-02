import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import dbConnect from "@/utils/dbConnect";

export const runtime = "nodejs";

const BUCKET = "candidateDocs";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_PER_CATEGORY = 5;

export const CATEGORIES: Record<string, string> = {
  cv: "Updated CV",
  certificates: "Internship / Job Experience Certificates",
  cnic: "Copy of CNIC",
  other: "Other Relevant Documents",
};

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected.");
  return new GridFSBucket(db, { bucketName: BUCKET });
}

type FileDoc = {
  _id: unknown;
  filename: string;
  length: number;
  uploadDate: Date;
  contentType?: string;
  metadata?: { candidateEmail?: string; category?: string };
};

async function listFor(email: string) {
  const bucket = getBucket();
  const files = (await bucket
    .find({ "metadata.candidateEmail": email })
    .sort({ uploadDate: -1 })
    .toArray()) as unknown as FileDoc[];

  return files.map((f) => ({
    id: String(f._id),
    filename: f.filename,
    category: f.metadata?.category || "other",
    categoryLabel: CATEGORIES[f.metadata?.category || "other"] || "Other",
    size: f.length,
    contentType: f.contentType || "application/octet-stream",
    uploadedAt: f.uploadDate,
  }));
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() || "";
    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }
    return NextResponse.json({ documents: await listFor(email) });
  } catch (error) {
    console.error("Documents list error:", error);
    return NextResponse.json(
      { message: "Failed to load documents." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const bucket = getBucket();

    const form = await request.formData();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const category = String(form.get("category") || "");
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }
    if (!CATEGORIES[category]) {
      return NextResponse.json({ message: "Invalid category." }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ message: "No files provided." }, { status: 400 });
    }

    const existing = (await bucket
      .find({ "metadata.candidateEmail": email, "metadata.category": category })
      .toArray()) as unknown as FileDoc[];

    if (existing.length + files.length > MAX_PER_CATEGORY) {
      return NextResponse.json(
        {
          message: `Limit is ${MAX_PER_CATEGORY} files for "${CATEGORIES[category]}". You already have ${existing.length}.`,
        },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { message: `"${file.name}" exceeds the 10 MB limit.` },
          { status: 400 }
        );
      }
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await new Promise<void>((resolve, reject) => {
        const upload = bucket.openUploadStream(file.name, {
          contentType: file.type || "application/octet-stream",
          metadata: {
            candidateEmail: email,
            category,
            uploadedAt: new Date(),
          },
        });
        upload.on("error", reject);
        upload.on("finish", () => resolve());
        upload.end(buffer);
      });
    }

    return NextResponse.json({
      message: `${files.length} file${files.length > 1 ? "s" : ""} uploaded.`,
      documents: await listFor(email),
    });
  } catch (error) {
    console.error("Documents upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload documents." },
      { status: 500 }
    );
  }
}
