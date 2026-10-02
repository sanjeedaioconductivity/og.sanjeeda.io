import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import dbConnect from "@/utils/dbConnect";

export const runtime = "nodejs";

const BUCKET = "candidateDocs";

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected.");
  return new GridFSBucket(db, { bucketName: BUCKET });
}

type FileDoc = {
  _id: unknown;
  filename: string;
  length: number;
  contentType?: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid file id." }, { status: 400 });
    }

    const bucket = getBucket();
    const _id = new ObjectId(id);
    const files = (await bucket.find({ _id }).toArray()) as unknown as FileDoc[];
    const file = files[0];
    if (!file) {
      return NextResponse.json({ message: "File not found." }, { status: 404 });
    }

    // Read the file into a buffer (max 10 MB, safe to buffer).
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = bucket.openDownloadStream(_id);
      stream.on("data", (c: Buffer) => chunks.push(c));
      stream.on("error", reject);
      stream.on("end", () => resolve());
    });
    const buffer = Buffer.concat(chunks);

    const { searchParams } = new URL(request.url);
    const disposition = searchParams.get("download") ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.contentType || "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(
          file.filename
        )}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { message: "Failed to fetch document." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid file id." }, { status: 400 });
    }

    await getBucket().delete(new ObjectId(id));
    return NextResponse.json({ message: "Document removed." });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete document." },
      { status: 500 }
    );
  }
}
