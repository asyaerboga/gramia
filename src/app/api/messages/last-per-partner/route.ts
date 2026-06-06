import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import mongoose from "mongoose";

// GET /api/messages/last-per-partner
// Returns the last message timestamp for each conversation partner.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    const result = await Message.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      {
        $project: {
          partnerId: {
            $cond: {
              if: { $eq: ["$senderId", userId] },
              then: "$receiverId",
              else: "$senderId",
            },
          },
          timestamp: 1,
        },
      },
      { $group: { _id: "$partnerId", lastTimestamp: { $max: "$timestamp" } } },
    ]);

    return NextResponse.json(
      result.map((r) => ({
        partnerId: r._id.toString(),
        lastTimestamp: r.lastTimestamp,
      })),
    );
  } catch (error) {
    console.error("last-per-partner error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
