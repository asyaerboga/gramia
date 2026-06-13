import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { id } = await params;
    const { emoji } = await request.json();
    if (!emoji) return NextResponse.json({ error: "Emoji gereklidir" }, { status: 400 });

    await dbConnect();

    const message = await Message.findById(id);
    if (!message) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
    if (message.isDeleted) return NextResponse.json({ error: "Silinmiş mesaja tepki verilemez" }, { status: 400 });

    const userId = session.user.id;
    const existingIdx = message.reactions.findIndex(
      (r: { emoji: string; userId: string }) => r.emoji === emoji && r.userId === userId,
    );

    if (existingIdx >= 0) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions.push({ emoji, userId });
    }

    await message.save();

    const reactionsMap = new Map<string, string[]>();
    for (const r of message.reactions) {
      if (!reactionsMap.has(r.emoji)) reactionsMap.set(r.emoji, []);
      reactionsMap.get(r.emoji)!.push(r.userId);
    }
    const reactions = Array.from(reactionsMap.entries()).map(([e, users]) => ({ emoji: e, users }));

    return NextResponse.json({ reactions });
  } catch (error) {
    console.error("React to message error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
