import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Tüm alanlar gereklidir" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalıdır" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select("password");
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json({ message: "Şifre güncellendi" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
