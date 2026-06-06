import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";
import { Types } from "mongoose";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeMessage(m: any, id: string, lastSeenAt: Map<string, Date>, members: { id: string; name: string; image: string | null }[]) {
  const sender = m.senderId;
  const senderId =
    sender && typeof sender === "object" && sender._id
      ? sender._id.toString()
      : sender
      ? sender.toString()
      : "";
  const senderName = sender?.name ?? "";

  const seenBy = members.filter((member) => {
    if (member.id === senderId) return false;
    const seenDate = lastSeenAt.get(member.id);
    return seenDate && seenDate >= new Date(m.timestamp);
  }).map((member) => ({ id: member.id, name: member.name, image: member.image }));

  return {
    _id: m._id.toString(),
    senderId,
    senderName,
    conversationId: id,
    type: m.type,
    content: m.content,
    filename: m.filename,
    timestamp: m.timestamp,
    status: m.status,
    seenBy,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const conversation = await Conversation.findById(id);
    if (!conversation) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

    const isMember = conversation.members.some(
      (m: Types.ObjectId) => m.toString() === session.user.id
    );
    if (!isMember) return NextResponse.json({ error: "Bu gruba erişim yetkiniz yok" }, { status: 403 });

    const memberDocs = await User.find(
      { _id: { $in: conversation.members } },
      "name image"
    ).lean();
    const members = memberDocs.map((u: { _id: Types.ObjectId; name: string; image?: string }) => ({
      id: u._id.toString(),
      name: u.name,
      image: u.image ?? null,
    }));

    const lastSeenAt: Map<string, Date> = conversation.lastSeenAt as Map<string, Date>;

    const messages = await Message.find({ conversationId: id })
      .populate("senderId", "name image")
      .sort({ timestamp: 1 });

    return NextResponse.json(messages.map((m) => serializeMessage(m, id, lastSeenAt, members)));
  } catch (error) {
    console.error("Group GET messages error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const conversation = await Conversation.findById(id);
    if (!conversation) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

    const isMember = conversation.members.some(
      (m: Types.ObjectId) => m.toString() === session.user.id
    );
    if (!isMember) {
      console.error("isMember check failed. userId:", session.user.id, "members:", conversation.members.map((m: Types.ObjectId) => m.toString()));
      return NextResponse.json({ error: "Bu gruba erişim yetkiniz yok" }, { status: 403 });
    }

    const { content, type, filename } = await request.json();
    if (!content) return NextResponse.json({ error: "İçerik gereklidir" }, { status: 400 });

    const message = await Message.create({
      senderId: session.user.id,
      conversationId: id,
      type: type || "text",
      content,
      filename,
      timestamp: new Date(),
      status: "sent",
    });

    await Conversation.findByIdAndUpdate(id, { $set: { updatedAt: new Date() } });

    const populated = await Message.findById(message._id).populate("senderId", "name image");

    return NextResponse.json(serializeMessage(populated, id), { status: 201 });
  } catch (error) {
    console.error("Group POST message error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
