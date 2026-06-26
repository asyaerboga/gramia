import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import WaterIntake from "@/lib/models/WaterIntake";
import Client from "@/lib/models/Client";
import { checkAndAwardAchievements } from "@/lib/achievementService";

// POST /api/water-intake - Add water intake
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { amount, date } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Geçerli bir miktar giriniz" },
        { status: 400 }
      );
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan profili bulunamadı" },
        { status: 404 }
      );
    }

    const today = date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(date + "T00:00:00.000Z")
      : (() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; })();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Update existing or create new
    const existing = await WaterIntake.findOne({
      clientId: client._id,
      date: { $gte: today, $lt: tomorrow },
    });

    if (existing) {
      existing.amount += amount;
      await existing.save();
      await checkAndAwardAchievements(client._id.toString()).catch(console.error);
      return NextResponse.json(existing);
    }

    const waterIntake = await WaterIntake.create({
      clientId: client._id,
      date: today,
      amount,
    });

    await checkAndAwardAchievements(client._id.toString()).catch(console.error);

    return NextResponse.json(waterIntake, { status: 201 });
  } catch (error) {
    console.error("Water intake error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
