import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ClientNote from "@/lib/models/ClientNote";
import Client from "@/lib/models/Client";

// GET /api/notes - Danışan notlarını getir
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const category = searchParams.get("category");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId gereklidir" },
        { status: 400 },
      );
    }

    // Diyetisyenin danışanı mı kontrol et
    const client = await Client.findById(clientId);
    if (!client || client.dietitianId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { clientId };
    if (category) query.category = category;

    const notes = await ClientNote.find(query).sort({
      isPinned: -1,
      createdAt: -1,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Notes fetch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/notes - Yeni not ekle
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, content, category, isPinned } = body;

    if (!clientId || !content) {
      return NextResponse.json(
        { error: "clientId ve content gereklidir" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Diyetisyenin danışanı mı kontrol et
    const client = await Client.findById(clientId);
    if (!client || client.dietitianId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const note = await ClientNote.create({
      clientId,
      dietitianId: session.user.id,
      content,
      category: category || "general",
      isPinned: isPinned || false,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Note create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/notes - Notu güncelle
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { noteId, content, category, isPinned } = body;

    if (!noteId) {
      return NextResponse.json({ error: "noteId gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const note = await ClientNote.findById(noteId);
    if (!note || note.dietitianId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (isPinned !== undefined) note.isPinned = isPinned;

    await note.save();

    return NextResponse.json(note);
  } catch (error) {
    console.error("Note update error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/notes - Not sil
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("id");

    if (!noteId) {
      return NextResponse.json({ error: "id gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const note = await ClientNote.findById(noteId);
    if (!note || note.dietitianId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await ClientNote.deleteOne({ _id: noteId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Note delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
