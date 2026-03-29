import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/lib/models/Appointment";
import Client from "@/lib/models/Client";

// GET /api/dietitian/appointments - Get all appointments for the dietitian
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get("upcoming");

    const query: Record<string, unknown> = {
      dietitianId: session.user.id,
    };

    if (upcoming === "true") {
      query.date = { $gte: new Date() };
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1 })
      .populate("clientId");

    const result = await Promise.all(
      appointments.map(async (apt) => {
        const client = apt.clientId as unknown as {
          _id: string;
          userId: string;
        };
        let clientName = "İsimsiz";

        if (client) {
          const clientDoc = await Client.findById(client._id || client).populate(
            "userId",
            "name"
          );
          if (clientDoc) {
            const user = clientDoc.userId as unknown as { name: string };
            clientName = user?.name || "İsimsiz";
          }
        }

        return {
          _id: apt._id,
          date: apt.date,
          time: apt.time,
          status: apt.status,
          notes: apt.notes,
          clientName,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch dietitian appointments error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
