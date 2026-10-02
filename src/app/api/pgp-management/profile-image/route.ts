import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import dbConnect from "@/utils/dbConnect";
import PgpProfile from "@/models/PgpProfile";

export const runtime = "nodejs";

/**
 * The PGP profile picture. Mirrors the mentor and candidate avatar routes
 * (same bucket pattern, same limits) but there is only ever one image: every
 * upload replaces it.
 */

const BUCKET = "pgpProfile";
const KEY = "pgp";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type FileDoc = {
  _id: ObjectId;
  filename: string;
  length: number;
  uploadDate: Date;
  contentType?: string;
};

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected.");
  return new GridFSBucket(db, { bucketName: BUCKET });
}

async function newest() {
  const files = (await getBucket()
    .find({})
    .sort({ uploadDate: -1 })
    .limit(1)
    .toArray()) as unknown as FileDoc[];
  return files[0] || null;
}

async function deleteAll() {
  const bucket = getBucket();
  const files = (await bucket.find({}).toArray()) as unknown as FileDoc[];
  for (const f of files) {
    try {
      await bucket.delete(f._id);
    } catch {
      /* already gone — ignore */
    }
  }
}

/** Public on purpose: it is the programme's own picture, shown in the portal. */
export async function GET() {
  try {
    await dbConnect();

    const file = await newest();
    if (!file) return new NextResponse(null, { status: 404 });

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = getBucket().openDownloadStream(file._id);
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
    console.error("PGP profile image load error:", error);
    return NextResponse.json({ message: "Failed to load the picture." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const form = await request.formData();
    const file = form.get("file");

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
      return NextResponse.json({ message: "Image exceeds the 5 MB limit." }, { status: 400 });
    }

    await deleteAll();

    const buffer = Buffer.from(await file.arrayBuffer());
    await new Promise<void>((resolve, reject) => {
      const upload = getBucket().openUploadStream(file.name || "pgp-profile", {
        contentType: file.type,
        metadata: { uploadedAt: new Date() },
      });
      upload.on("error", reject);
      upload.on("finish", () => resolve());
      upload.end(buffer);
    });

    await PgpProfile.findOneAndUpdate(
      { key: KEY },
      { $set: { key: KEY, hasPicture: true } },
      { upsert: true }
    );

    return NextResponse.json({ message: "Picture updated." });
  } catch (error) {
    console.error("PGP profile image upload error:", error);
    return NextResponse.json({ message: "Failed to upload the picture." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();
    await deleteAll();
    await PgpProfile.findOneAndUpdate(
      { key: KEY },
      { $set: { key: KEY, hasPicture: false } },
      { upsert: true }
    );
    return NextResponse.json({ message: "Picture removed." });
  } catch (error) {
    console.error("PGP profile image delete error:", error);
    return NextResponse.json({ message: "Failed to remove the picture." }, { status: 500 });
  }
}
