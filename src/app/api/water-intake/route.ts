import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import WaterIntake from "@/lib/models/WaterIntake";
import Client from "@/lib/models/Client";

// POST /api/water-intake - Add water intake
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { amount } = await request.json();

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update existing or create new
    const existing = await WaterIntake.findOne({
      clientId: client._id,
      date: { $gte: today },
    });

    if (existing) {
      existing.amount += amount;
      await existing.save();
      return NextResponse.json(existing);
    }

    const waterIntake = await WaterIntake.create({
      clientId: client._id,
      date: today,
      amount,
    });

    return NextResponse.json(waterIntake, { status: 201 });
  } catch (error) {
    console.error("Water intake error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
