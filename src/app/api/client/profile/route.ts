import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import { checkAndAwardAchievements } from "@/lib/achievementService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const [client, user] = await Promise.all([
      Client.findOne({ userId: session.user.id }).select(
        "phone birthDate gender address occupation height weight targetWeight activityLevel targetCalories targetProtein targetCarbs targetFat targetWater allergies medications goals",
      ),
      User.findById(session.user.id).select("name email"),
    ]);

    if (!client || !user) {
      return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      ...client.toObject(),
      name: user.name,
      email: user.email,
      currentWeight: client.weight,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    // Client şemasında olan alanlar
    const allowedFields = [
      "phone",
      "birthDate",
      "gender",
      "address",
      "occupation",
      "height",
      "weight",
      "targetWeight",
      "activityLevel",
      "targetCalories",
      "targetProtein",
      "targetCarbs",
      "targetFat",
      "targetWater",
      "allergies",
      "medications",
      "goals",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    // Frontend tarafında kilo "currentWeight" olarak adlandırılıyor, şemadaki gerçek alan "weight"
    if (body.currentWeight !== undefined) {
      updateData.weight = body.currentWeight;
    }
    // Boş string gönderilen enum/Date alanları Mongoose validasyonunu kırar, bu yüzden seçilmemiş kabul edilir
    if (updateData.gender === "") delete updateData.gender;
    if (updateData.birthDate === "") delete updateData.birthDate;
    if (updateData.activityLevel === "") delete updateData.activityLevel;

    // "name" Client şemasında değil, User modelinde tutuluyor
    if (body.name !== undefined) {
      await User.findByIdAndUpdate(session.user.id, { $set: { name: body.name } });
    }

    const client = await Client.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!client) {
      return NextResponse.json({ error: "Danışan bulunamadı" }, { status: 404 });
    }

    if (updateData.weight !== undefined) {
      await checkAndAwardAchievements(client._id.toString()).catch(console.error);
    }

    return NextResponse.json({
      message: "Profil başarıyla güncellendi",
      client,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 },
    );
  }
}
