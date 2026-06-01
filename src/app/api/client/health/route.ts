import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import BloodTest from "@/lib/models/BloodTest";

// GET /api/client/health — read-only for the client
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const client = await Client.findById(session.user.id).select("chronicDiseases");
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const bloodTests = await BloodTest.find({ clientId: session.user.id })
      .sort({ testDate: -1 })
      .select("imageUrl originalName notes testDate createdAt");

    return NextResponse.json({
      chronicDiseases: client.chronicDiseases || [],
      bloodTests,
    });
  } catch (error) {
    console.error("Client health GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
