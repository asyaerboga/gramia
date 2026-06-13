import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (session.user.role !== "dietitian")
    return NextResponse.json({ error: "Sadece diyetisyenler grubu düzenleyebilir" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Sadece resim dosyaları yüklenebilir" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Dosya boyutu 5MB'dan küçük olmalıdır" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;

  await dbConnect();
  const conversation = await Conversation.findOneAndUpdate(
    { _id: id, createdBy: session.user.id },
    { $set: { image: base64 } },
    { new: true }
  );

  if (!conversation)
    return NextResponse.json({ error: "Grup bulunamadı veya yetkiniz yok" }, { status: 404 });

  return NextResponse.json({ image: base64 });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (session.user.role !== "dietitian")
    return NextResponse.json({ error: "Sadece diyetisyenler grubu silebilir" }, { status: 403 });

  await dbConnect();
  const conversation = await Conversation.findOneAndDelete({
    _id: id,
    createdBy: session.user.id,
  });

  if (!conversation)
    return NextResponse.json({ error: "Grup bulunamadı veya yetkiniz yok" }, { status: 404 });

  return NextResponse.json({ success: true });
}
