import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import dbConnect from "@/utils/dbConnect";

export const runtime = "nodejs";

// Mentor profile photos. Mirrors the candidate one
// (src/app/api/pgp-candidate/profile-image/route.ts) but in its own bucket and
// keyed by mentorEmail. One avatar per mentor email — every upload replaces it.
const BUCKET = "mentorAvatars";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type FileDoc = {
  _id: ObjectId;
  filename: string;
  length: number;
  uploadDate: Date;
  contentType?: string;
  metadata?: { mentorEmail?: string };
};

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected.");
  return new GridFSBucket(db, { bucketName: BUCKET });
}

async function newestFor(email: string) {
  const bucket = getBucket();
  const files = (await bucket
    .find({ "metadata.mentorEmail": email })
    .sort({ uploadDate: -1 })
    .limit(1)
    .toArray()) as unknown as FileDoc[];
  return files[0] || null;
}

async function deleteAllFor(email: string) {
  const bucket = getBucket();
  const files = (await bucket
    .find({ "metadata.mentorEmail": email })
    .toArray()) as unknown as FileDoc[];
  for (const f of files) {
    try {
      await bucket.delete(f._id);
    } catch {
      /* already gone — ignore */
    }
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() || "";
    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const file = await newestFor(email);
    if (!file) {
      return new NextResponse(null, { status: 404 });
    }

    const bucket = getBucket();
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = bucket.openDownloadStream(file._id);
      stream.on("data", (c: Buffer) => chunks.push(c));
      stream.on("error", reject);
      stream.on("end", () => resolve());
    });

    const body = Buffer.concat(chunks);
    return new NextResponse(body as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": file.contentType || "image/jpeg",
        "Content-Length": String(body.length),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("Mentor profile image load error:", error);
    return NextResponse.json(
      { message: "Failed to load profile image." },
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
    const file = form.get("file");

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No image provided." }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { message: "Use a JPG, PNG, WEBP or GIF image." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: "Image exceeds the 5 MB limit." },
        { status: 400 }
      );
    }

    await deleteAllFor(email);

    const buffer = Buffer.from(await file.arrayBuffer());
    await new Promise<void>((resolve, reject) => {
      const upload = bucket.openUploadStream(file.name || `${email}-avatar`, {
        contentType: file.type,
        metadata: { mentorEmail: email, uploadedAt: new Date() },
      });
      upload.on("error", reject);
      upload.on("finish", () => resolve());
      upload.end(buffer);
    });

    return NextResponse.json({ message: "Profile photo updated." });
  } catch (error) {
    console.error("Mentor profile image upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload profile image." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() || "";
    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }
    await deleteAllFor(email);
    return NextResponse.json({ message: "Profile photo removed." });
  } catch (error) {
    console.error("Mentor profile image delete error:", error);
    return NextResponse.json(
      { message: "Failed to remove profile image." },
      { status: 500 }
    );
  }
}
