import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";

// GET /api/messages - Get messages between current user and partner
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("partnerId");

    if (!partnerId) {
      return NextResponse.json(
        { error: "partnerId gereklidir" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Mark incoming 'sent' messages as 'delivered' when receiver polls
    await Message.updateMany(
      { senderId: partnerId, receiverId: session.user.id, status: "sent" },
      { $set: { status: "delivered" } }
    );

    const messages = await Message.find({
      $or: [
        { senderId: session.user.id, receiverId: partnerId },
        { senderId: partnerId, receiverId: session.user.id },
      ],
    }).sort({ timestamp: 1 });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { receiverId, type, content } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: "receiverId ve content gereklidir" },
        { status: 400 }
      );
    }

    await dbConnect();

    const message = await Message.create({
      senderId: session.user.id,
      receiverId,
      type: type || "text",
      content,
      timestamp: new Date(),
      status: "sent",
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
