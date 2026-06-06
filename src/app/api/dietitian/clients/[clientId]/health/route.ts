import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import BloodTest from "@/lib/models/BloodTest";
import fs from "fs";
import path from "path";

type Params = { params: Promise<{ clientId: string }> };

// GET /api/dietitian/clients/[clientId]/health
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { clientId } = await params;
    await dbConnect();

    const client = await Client.findOne({
      _id: clientId,
      dietitianId: session.user.id,
    }).select("chronicDiseases");

    if (!client) {
      return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });
    }

    const bloodTests = await BloodTest.find({
      clientId,
      dietitianId: session.user.id,
    }).sort({ testDate: -1 });

    return NextResponse.json({
      chronicDiseases: client.chronicDiseases || [],
      bloodTests,
    });
  } catch (error) {
    console.error("Health GET error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/dietitian/clients/[clientId]/health
// Content-Type: application/json  → add/remove chronic disease
// Content-Type: multipart/form-data → upload blood test image
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { clientId } = await params;
    await dbConnect();

    const client = await Client.findOne({
      _id: clientId,
      dietitianId: session.user.id,
    });
    if (!client) {
      return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // File upload: blood test image
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      const notes = (formData.get("notes") as string) || "";
      const testDate = (formData.get("testDate") as string) || new Date().toISOString().split("T")[0];

      if (!file || file.size === 0) {
        return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
      const allowedExts = ["jpg", "jpeg", "png", "webp", "pdf"];
      if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
        return NextResponse.json(
          { error: "Sadece JPG, PNG, WEBP veya PDF formatı desteklenmektedir" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "blood-tests", clientId);
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), buffer);

      const imageUrl = `/uploads/blood-tests/${clientId}/${filename}`;

      const bloodTest = await BloodTest.create({
        clientId,
        dietitianId: session.user.id,
        imageUrl,
        originalName: file.name,
        notes,
        testDate: new Date(testDate),
      });

      return NextResponse.json({ bloodTest }, { status: 201 });
    } else {
      // JSON: add chronic disease
      const { disease } = await request.json();
      if (!disease || typeof disease !== "string" || !disease.trim()) {
        return NextResponse.json({ error: "Geçersiz hastalık adı" }, { status: 400 });
      }

      const trimmed = disease.trim();
      if (!client.chronicDiseases.includes(trimmed)) {
        await Client.findByIdAndUpdate(clientId, {
          $addToSet: { chronicDiseases: trimmed },
        });
      }

      return NextResponse.json({ message: "Eklendi" }, { status: 201 });
    }
  } catch (error) {
    console.error("Health POST error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/dietitian/clients/[clientId]/health
// Body: { type: "disease", disease: "..." } | { type: "bloodTest", bloodTestId: "..." }
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { clientId } = await params;
    const { type, disease, bloodTestId } = await request.json();
    await dbConnect();

    if (type === "disease") {
      await Client.findOneAndUpdate(
        { _id: clientId, dietitianId: session.user.id },
        { $pull: { chronicDiseases: disease } },
      );
      return NextResponse.json({ message: "Silindi" });
    }

    if (type === "bloodTest") {
      const test = await BloodTest.findOne({
        _id: bloodTestId,
        clientId,
        dietitianId: session.user.id,
      });
      if (!test) {
        return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
      }

      // Delete file from disk
      const filePath = path.join(process.cwd(), "public", test.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await BloodTest.findByIdAndDelete(bloodTestId);
      return NextResponse.json({ message: "Silindi" });
    }

    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  } catch (error) {
    console.error("Health DELETE error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
