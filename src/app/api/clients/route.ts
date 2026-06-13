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

    const {
      name, email, password, phone, gender,
      age, height, weight, targetWeight, activityLevel,
      chronicDiseases, allergies, medications, goals,
      targetCalories, targetProtein, targetCarbs, targetFat, targetWater,
      occupation,
    } = await request.json();

    if (!name || !email || !password || !age || !height || !weight || !targetWeight || !gender) {
      return NextResponse.json(
        { error: "Zorunlu alanları doldurun" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email zaten kayıtlı" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "client",
      phone: phone || undefined,
      gender: gender || undefined,
    });

    const client = await Client.create({
      userId: user._id,
      dietitianId: session.user.id,
      age,
      height,
      weight,
      targetWeight,
      startWeight: weight,
      gender: gender || undefined,
      activityLevel: activityLevel || "moderate",
      chronicDiseases: chronicDiseases || [],
      allergies: allergies || [],
      medications: medications || [],
      goals: goals || [],
      occupation: occupation || undefined,
      phone: phone || undefined,
      targetCalories: targetCalories || undefined,
      targetProtein: targetProtein || undefined,
      targetCarbs: targetCarbs || undefined,
      targetFat: targetFat || undefined,
      targetWater: targetWater || undefined,
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
