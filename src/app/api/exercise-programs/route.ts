import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ExerciseProgram from "@/lib/models/ExerciseProgram";
import Exercise from "@/lib/models/Exercise";
import Client from "@/lib/models/Client";
import { checkAndAwardAchievements } from "@/lib/achievementService";

async function getClientId(userId: string) {
  const client = await Client.findOne({ userId });
  return client ?? null;
}

// GET /api/exercise-programs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    await dbConnect();
    const client = await getClientId(session.user.id);
    if (!client) return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });

    const program = await ExerciseProgram.findOne({ clientId: client._id });
    return NextResponse.json(program ?? null);
  } catch (error) {
    console.error("ExerciseProgram GET error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/exercise-programs - Program oluştur veya güncelle
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const body = await request.json();
    const { name, days } = body;

    if (!days || !Array.isArray(days)) {
      return NextResponse.json({ error: "days dizisi gereklidir" }, { status: 400 });
    }

    await dbConnect();
    const client = await getClientId(session.user.id);
    if (!client) return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });

    const program = await ExerciseProgram.findOneAndUpdate(
      { clientId: client._id },
      { name: name || "Haftalık Programım", days },
      { upsert: true, new: true },
    );

    return NextResponse.json(program, { status: 200 });
  } catch (error) {
    console.error("ExerciseProgram POST error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/exercise-programs - Günü tamamla: egzersizleri kaydet + completion ekle
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const body = await request.json();
    const { date, dayOfWeek, justMark } = body as { date: string; dayOfWeek: number; justMark?: boolean };

    if (!date || dayOfWeek === undefined) {
      return NextResponse.json({ error: "date ve dayOfWeek gereklidir" }, { status: 400 });
    }

    await dbConnect();
    const client = await getClientId(session.user.id);
    if (!client) return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });

    const program = await ExerciseProgram.findOne({ clientId: client._id });
    if (!program) return NextResponse.json({ error: "Program bulunamadı" }, { status: 404 });

    // Zaten tamamlandıysa tekrar kaydetme
    if (program.completions.includes(date)) {
      return NextResponse.json(program);
    }

    if (!justMark) {
      // İlgili günün egzersizlerini bul
      const dayProgram = program.days.find((d) => d.dayOfWeek === dayOfWeek);
      if (!dayProgram || dayProgram.exercises.length === 0) {
        return NextResponse.json({ error: "Bu gün için program egzersizi yok" }, { status: 400 });
      }

      // Egzersizleri Exercise koleksiyonuna kaydet
      const exerciseDate = new Date(date);
      exerciseDate.setHours(12, 0, 0, 0);

      await Exercise.insertMany(
        dayProgram.exercises.map((ex) => ({
          clientId: client._id,
          date: exerciseDate,
          type: ex.type,
          name: ex.name,
          duration: ex.duration,
          caloriesBurned: ex.caloriesBurned ?? Math.round(ex.duration * 5),
          intensity: "medium",
          notes: ex.notes,
        })),
      );
    }

    // Completion tarihini ekle
    program.completions.push(date);
    await program.save();

    await checkAndAwardAchievements(client._id.toString()).catch(console.error);

    return NextResponse.json(program);
  } catch (error) {
    console.error("ExerciseProgram PATCH error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/exercise-programs
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    await dbConnect();
    const client = await getClientId(session.user.id);
    if (!client) return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });

    await ExerciseProgram.deleteOne({ clientId: client._id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ExerciseProgram DELETE error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
