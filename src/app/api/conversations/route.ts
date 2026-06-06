import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  await dbConnect();
  const conversations = await Conversation.find({ members: session.user.id }).sort({ updatedAt: -1 });
  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.role !== "dietitian") {
    return NextResponse.json({ error: "Sadece diyetisyenler grup oluşturabilir" }, { status: 403 });
  }

  const { name, memberIds } = await request.json();

  if (!name?.trim() || !Array.isArray(memberIds) || memberIds.length === 0) {
    return NextResponse.json({ error: "Grup adı ve en az bir üye gereklidir" }, { status: 400 });
  }

  await dbConnect();

  const conversation = await Conversation.create({
    name: name.trim(),
    createdBy: session.user.id,
    members: [session.user.id, ...memberIds],
  });

  return NextResponse.json(conversation, { status: 201 });
}
