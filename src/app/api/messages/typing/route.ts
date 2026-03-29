import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setTyping, isTyping } from "@/lib/typingStore";

// POST /api/messages/typing - Notify that user is typing
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

    setTyping(session.user.id, partnerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Typing error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// GET /api/messages/typing?partnerId=xxx - Check if partner is typing
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

    const typing = isTyping(partnerId, session.user.id);
    return NextResponse.json({ typing });
  } catch (error) {
    console.error("Typing check error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
