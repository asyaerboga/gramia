import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/m4a"];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

function getMsgType(mime: string): "image" | "audio" | "document" {
  if (IMAGE_TYPES.includes(mime)) return "image";
  if (AUDIO_TYPES.includes(mime)) return "audio";
  return "document";
}

// POST /api/upload/message
// Accepts multipart/form-data with a "file" field.
// Returns { url, msgType, filename }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const allAllowed = [...IMAGE_TYPES, ...AUDIO_TYPES, ...DOC_TYPES];
    if (!allAllowed.includes(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya türü" }, { status: 400 });
    }

    const MAX_MB = 20;
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Maksimum ${MAX_MB}MB` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "messages");
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    return NextResponse.json({
      url: `/uploads/messages/${filename}`,
      msgType: getMsgType(file.type),
      filename: file.name,
    });
  } catch (error) {
    console.error("Upload message error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
