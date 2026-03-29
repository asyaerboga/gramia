import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Meal from "@/lib/models/Meal";

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
    }).populate("userId", "name email");

    if (!client) {
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

    const meals = await Meal.find({
      clientId: client._id,
      date: { $gte: today, $lt: tomorrow },
    });
    const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);

    const user = client.userId as unknown as { name: string };

    return NextResponse.json({
      _id: client._id,
      name: user?.name || "İsimsiz",
      age: client.age,
      height: client.height,
      weight: client.weight,
      startWeight: client.startWeight,
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
    const { weight, targetWeight } = await request.json();

    await dbConnect();

    const updateData: Record<string, number> = {};
    if (weight) updateData.weight = weight;
    if (targetWeight) updateData.targetWeight = targetWeight;

    const client = await Client.findOneAndUpdate(
      { _id: clientId, dietitianId: session.user.id },
      { $set: updateData },
      { new: true }
    );

    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 }
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
