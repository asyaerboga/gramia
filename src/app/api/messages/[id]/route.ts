import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";

const TEN_MINUTES = 10 * 60 * 1000;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { id } = await params;
    const { content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: "İçerik gereklidir" }, { status: 400 });

    await dbConnect();

    const message = await Message.findById(id);
    if (!message) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
    if (message.senderId.toString() !== session.user.id)
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    if (message.type !== "text")
      return NextResponse.json({ error: "Sadece metin mesajları düzenlenebilir" }, { status: 400 });
    if (message.isDeleted)
      return NextResponse.json({ error: "Silinmiş mesaj düzenlenemez" }, { status: 400 });

    const age = Date.now() - new Date(message.timestamp).getTime();
    if (age > TEN_MINUTES)
      return NextResponse.json({ error: "10 dakika geçti, mesaj düzenlenemez" }, { status: 403 });

    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();

    return NextResponse.json(message);
  } catch (error) {
    console.error("Edit message error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const message = await Message.findById(id);
    if (!message) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
    if (message.senderId.toString() !== session.user.id)
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    if (message.isDeleted)
      return NextResponse.json({ error: "Zaten geri alınmış" }, { status: 400 });

    const age = Date.now() - new Date(message.timestamp).getTime();
    if (age > TEN_MINUTES)
      return NextResponse.json({ error: "10 dakika geçti, mesaj geri alınamaz" }, { status: 403 });

    message.isDeleted = true;
    message.content = "Bu mesaj geri alındı";
    await message.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
