import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import Meal from "@/lib/models/Meal";

// GET /api/dietitian/clients - Get all clients for the dietitian
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    const clients = await Client.find({ dietitianId: session.user.id }).populate(
      "userId",
      "name email"
    );

    // Get today's calories for each client
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const clientsWithData = await Promise.all(
      clients.map(async (client) => {
        const meals = await Meal.find({
          clientId: client._id,
          date: { $gte: today, $lt: tomorrow },
        });
        const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);

        const user = client.userId as unknown as { name: string; email: string };
        return {
          _id: client._id,
          userId: client.userId,
          name: user?.name || "İsimsiz",
          email: user?.email || "",
          age: client.age,
          height: client.height,
          weight: client.weight,
          startWeight: client.startWeight,
          targetWeight: client.targetWeight,
          currentWeight: client.weight,
          chronicDiseases: client.chronicDiseases,
          totalCalories,
        };
      })
    );

    return NextResponse.json(clientsWithData);
  } catch (error) {
    console.error("Fetch clients error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
