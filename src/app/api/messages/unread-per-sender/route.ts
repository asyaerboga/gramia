import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";
import mongoose from "mongoose";

// GET /api/messages/unread-per-sender
// Returns per-sender unread message counts with sender names and last message preview.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const unread = await Message.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(session.user.id),
          status: { $in: ["sent", "delivered"] },
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
          lastContent: { $first: "$content" },
          lastType: { $first: "$type" },
          lastTimestamp: { $first: "$timestamp" },
        },
      },
    ]);

    if (unread.length === 0) return NextResponse.json([]);

    const senderIds = unread.map((u) => u._id);
    const users = await User.find({ _id: { $in: senderIds } }).select("name");
    const nameMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    const result = unread.map((u) => ({
      senderId: u._id.toString(),
      senderName: nameMap.get(u._id.toString()) || "Bilinmeyen",
      count: u.count,
      lastMessage:
        u.lastType === "text"
          ? (u.lastContent as string).slice(0, 60)
          : u.lastType === "image"
          ? "📷 Fotoğraf"
          : u.lastType === "audio"
          ? "🎤 Ses kaydı"
          : "📎 Dosya",
      lastTimestamp: u.lastTimestamp,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("unread-per-sender error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
