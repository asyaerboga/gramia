import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import Conversation from "@/lib/models/Conversation";
import { Types } from "mongoose";

// GET /api/conversations/unread-groups
// Returns unread message counts per group conversation for the current user.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    await dbConnect();

    const userId = new Types.ObjectId(session.user.id);
    const conversations = await Conversation.find({ members: userId });

    if (conversations.length === 0) return NextResponse.json([]);

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const lastSeen: Date = conv.lastSeenAt?.get(session.user.id) ?? new Date(0);
        const count = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          timestamp: { $gt: lastSeen },
        });
        return { conversationId: conv._id.toString(), unreadCount: count };
      }),
    );

    return NextResponse.json(results.filter((r) => r.unreadCount > 0));
  } catch (error) {
    console.error("unread-groups error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
