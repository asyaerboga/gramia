import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import { Types } from "mongoose";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/conversations/[id]/mark-read
// Updates the current user's lastSeenAt timestamp for the conversation.
export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const conversation = await Conversation.findById(id);
    if (!conversation) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

    const isMember = conversation.members.some(
      (m: Types.ObjectId) => m.toString() === session.user.id,
    );
    if (!isMember) return NextResponse.json({ error: "Erişim yetkiniz yok" }, { status: 403 });

    await Conversation.findByIdAndUpdate(id, {
      $set: { [`lastSeenAt.${session.user.id}`]: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mark-read error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
