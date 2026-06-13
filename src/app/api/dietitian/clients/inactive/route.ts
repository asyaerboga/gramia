import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";

// GET /api/dietitian/clients/inactive - pasife alınmış danışanlar
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    const clients = await Client.find({
      dietitianId: session.user.id,
      isActive: false,
    }).populate("userId", "name email image");

    const result = clients.map((c) => {
      const user = c.userId as unknown as { name: string; email: string; image?: string };
      return {
        _id: c._id,
        name: user?.name || "İsimsiz",
        email: user?.email || "",
        image: user?.image || null,
        age: c.age,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch inactive clients error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
