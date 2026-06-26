import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select(
      "name email phone gender",
    );

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch dietitian profile:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    const allowedFields = ["name", "phone", "gender"];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    // Boş string gönderilen gender alanı Mongoose enum validasyonunu kırar, bu yüzden seçilmemiş kabul edilir
    if (updateData.gender === "") delete updateData.gender;

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("name email phone gender");

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profil başarıyla güncellendi", user });
  } catch (error) {
    console.error("Failed to update dietitian profile:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 },
    );
  }
}
