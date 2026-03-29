import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";

// GET /api/client/dietitian - Get the assigned dietitian info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan profili bulunamadı" },
        { status: 404 }
      );
    }

    const dietitian = await User.findById(client.dietitianId).select(
      "name email image"
    );
    if (!dietitian) {
      return NextResponse.json(
        { error: "Diyetisyen bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: dietitian._id,
      name: dietitian.name,
      email: dietitian.email,
    });
  } catch (error) {
    console.error("Fetch dietitian error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
