import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Client from "@/lib/models/Client";

// POST /api/clients - Create a new client (dietitian only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { name, email, password, age, height, weight, targetWeight, chronicDiseases } =
      await request.json();

    if (!name || !email || !password || !age || !height || !weight || !targetWeight) {
      return NextResponse.json(
        { error: "Tüm alanlar gereklidir" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email zaten kayıtlı" },
        { status: 409 }
      );
    }

    // Create user account for the client
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "client",
    });

    // Create client profile
    const client = await Client.create({
      userId: user._id,
      dietitianId: session.user.id,
      age,
      height,
      weight,
      targetWeight,
      startWeight: weight,
      chronicDiseases: chronicDiseases || [],
    });

    return NextResponse.json(
      { message: "Danışan oluşturuldu", client },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
