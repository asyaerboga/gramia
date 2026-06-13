import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Meal from "@/lib/models/Meal";
import Measurement from "@/lib/models/Measurement";
import mongoose from "mongoose";

// GET /api/dietitian/clients/[clientId] - Get client profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { clientId } = await params;
    await dbConnect();

    const client = await Client.findOne({
      _id: clientId,
      dietitianId: session.user.id,
    }).populate("userId", "name email image");

    if (!client || client.isActive === false) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 }
      );
    }

    // Today's calories
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [meals, latestMeasurement] = await Promise.all([
      Meal.find({ clientId: client._id, date: { $gte: today, $lt: tomorrow } }),
      Measurement.findOne({ clientId: client._id, weight: { $exists: true, $ne: null } }).sort({ date: -1 }),
    ]);
    const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
    const currentWeight = latestMeasurement?.weight ?? client.weight;

    const user = client.userId as unknown as { name: string; image?: string };

    return NextResponse.json({
      _id: client._id,
      name: user?.name || "İsimsiz",
      avatarUrl: user?.image || null,
      age: client.age,
      height: client.height,
      weight: currentWeight,
      startWeight: client.startWeight ?? client.weight,
      targetWeight: client.targetWeight,
      chronicDiseases: client.chronicDiseases,
      totalCalories,
      targetCalories: 1800,
    });
  } catch (error) {
    console.error("Fetch client error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// DELETE /api/dietitian/clients/[clientId] - Soft-delete client (set isActive: false)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { clientId } = await params;
    await dbConnect();

    const result = await Client.findOneAndUpdate(
      { _id: clientId, dietitianId: session.user.id },
      { $set: { isActive: false } },
      { new: true, strict: false }
    );

    if (!result) {
      return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ message: "Danışan pasife alındı" });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/dietitian/clients/[clientId] - Update client weight
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { clientId } = await params;
    const { weight, targetWeight, isActive } = await request.json();

    await dbConnect();

    const updateData: Record<string, unknown> = {};
    if (weight) updateData.weight = weight;
    if (targetWeight) updateData.targetWeight = targetWeight;
    if (isActive === true) updateData.isActive = true;

    const client = await Client.findOneAndUpdate(
      { _id: clientId, dietitianId: session.user.id },
      { $set: updateData },
      { new: true, strict: false }
    );

    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 }
      );
    }

    // Kilo güncellendiğinde en güncel ağırlık olarak Measurement kaydı oluştur
    // Böylece daily-summary ve stats API'leri yeni kiloyu doğru gösterir
    if (weight) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await Measurement.findOneAndUpdate(
        {
          clientId: new mongoose.Types.ObjectId(clientId),
          date: { $gte: today, $lt: tomorrow },
        },
        {
          $set: {
            clientId: new mongoose.Types.ObjectId(clientId),
            date: new Date(),
            weight,
          },
          $setOnInsert: {
            regions: { neck: 0, chest: 0, waist: 0, hip: 0, arm: 0, thigh: 0, calf: 0 },
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ message: "Güncellendi", client });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
