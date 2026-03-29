import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Achievement, { ACHIEVEMENT_DEFINITIONS } from "@/lib/models/Achievement";
import Client from "@/lib/models/Client";

// GET /api/achievements - Başarıları getir
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    let targetClientId = clientId;

    if (session.user.role === "client") {
      const client = await Client.findOne({ userId: session.user.id });
      if (!client) {
        return NextResponse.json(
          { error: "Danışan bulunamadı" },
          { status: 404 },
        );
      }
      targetClientId = client._id.toString();
    }

    if (!targetClientId) {
      return NextResponse.json(
        { error: "clientId gereklidir" },
        { status: 400 },
      );
    }

    // Kazanılmış başarıları getir
    const unlockedAchievements = await Achievement.find({
      clientId: targetClientId,
    });

    // Tüm başarı tanımlarını kazanılma durumu ile birlikte döndür
    const achievementList = Object.values(ACHIEVEMENT_DEFINITIONS).map(
      (def) => {
        const unlocked = unlockedAchievements.find(
          (a) => a.achievementId === def.id,
        );
        return {
          ...def,
          unlocked: !!unlocked,
          unlockedAt: unlocked?.unlockedAt,
        };
      },
    );

    // Client puanlarını da döndür
    const client = await Client.findById(targetClientId);
    const totalPoints = client?.totalPoints || 0;

    return NextResponse.json({
      achievements: achievementList,
      totalPoints,
      unlockedCount: unlockedAchievements.length,
      totalCount: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
    });
  } catch (error) {
    console.error("Achievement fetch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/achievements - Başarı kilitle aç (internal use)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const { achievementId } = body;

    if (!achievementId) {
      return NextResponse.json(
        { error: "achievementId gereklidir" },
        { status: 400 },
      );
    }

    // Başarı tanımını kontrol et
    const achievementDef = Object.values(ACHIEVEMENT_DEFINITIONS).find(
      (def) => def.id === achievementId,
    );
    if (!achievementDef) {
      return NextResponse.json({ error: "Geçersiz başarı" }, { status: 400 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 },
      );
    }

    // Zaten var mı kontrol et
    const existing = await Achievement.findOne({
      clientId: client._id,
      achievementId,
    });
    if (existing) {
      return NextResponse.json({
        message: "Başarı zaten kazanılmış",
        achievement: existing,
      });
    }

    // Başarı oluştur
    const achievement = await Achievement.create({
      clientId: client._id,
      achievementId,
      unlockedAt: new Date(),
    });

    // Puanları güncelle
    client.totalPoints = (client.totalPoints || 0) + achievementDef.points;
    await client.save();

    return NextResponse.json(
      {
        message: "Başarı kazanıldı!",
        achievement,
        pointsEarned: achievementDef.points,
        totalPoints: client.totalPoints,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Achievement create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
