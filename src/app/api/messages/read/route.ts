import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";

// POST /api/messages/read - Mark all messages from partner as read
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { partnerId } = await request.json();
    if (!partnerId) {
      return NextResponse.json(
        { error: "partnerId gereklidir" },
        { status: 400 }
      );
    }

    await dbConnect();

    await Message.updateMany(
      {
        senderId: partnerId,
        receiverId: session.user.id,
        status: { $in: ["sent", "delivered"] },
      },
      { $set: { status: "read" } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
