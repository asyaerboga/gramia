import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import { checkAndAwardAchievements } from "@/lib/achievementService";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/models/Achievement";

// POST /api/achievements/check
// Triggers a full achievement check for the current client.
// Returns any newly awarded achievement IDs and their definitions.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });
    }

    const newlyAwarded = await checkAndAwardAchievements(client._id.toString());

    const defs = Object.values(ACHIEVEMENT_DEFINITIONS);
    const newAchievements = newlyAwarded
      .map((id) => defs.find((d) => d.id === id))
      .filter(Boolean);

    return NextResponse.json({ newlyAwarded: newAchievements });
  } catch (error) {
    console.error("Achievement check error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
