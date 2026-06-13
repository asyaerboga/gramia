import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import Conversation from "@/lib/models/Conversation";
import { Types } from "mongoose";

const TEN_MINUTES = 10 * 60 * 1000;

interface RouteContext {
  params: Promise<{ id: string; msgId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { id, msgId } = await params;
    const { content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: "İçerik gereklidir" }, { status: 400 });

    await dbConnect();

    const conversation = await Conversation.findById(id);
    if (!conversation) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

    const isMember = conversation.members.some(
      (m: Types.ObjectId) => m.toString() === session.user.id
    );
    if (!isMember) return NextResponse.json({ error: "Bu gruba erişim yetkiniz yok" }, { status: 403 });

    const message = await Message.findById(msgId);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Edit group message error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { id, msgId } = await params;
    await dbConnect();

    const conversation = await Conversation.findById(id);
    if (!conversation) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

    const isMember = conversation.members.some(
      (m: Types.ObjectId) => m.toString() === session.user.id
    );
    if (!isMember) return NextResponse.json({ error: "Bu gruba erişim yetkiniz yok" }, { status: 403 });

    const message = await Message.findById(msgId);
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
    console.error("Delete group message error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
