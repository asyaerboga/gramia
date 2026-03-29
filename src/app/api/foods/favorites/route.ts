import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import FoodFavorite from "@/lib/models/FoodFavorite";
import Client from "@/lib/models/Client";

// GET /api/foods/favorites - Favori yiyecekleri getir
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { clientId: client._id };
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const favorites = await FoodFavorite.find(query)
      .sort({ usageCount: -1 })
      .limit(50);

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Food favorites fetch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/foods/favorites - Favori ekle veya kullanım sayısını artır
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const { name, calories, protein, carbs, fat, portion, category } = body;

    if (!name || !calories) {
      return NextResponse.json(
        { error: "name ve calories gereklidir" },
        { status: 400 },
      );
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 },
      );
    }

    // Upsert: varsa kullanım sayısını artır, yoksa oluştur
    const favorite = await FoodFavorite.findOneAndUpdate(
      { clientId: client._id, name: { $regex: `^${name}$`, $options: "i" } },
      {
        $setOnInsert: {
          clientId: client._id,
          name,
          calories,
          protein: protein || 0,
          carbs: carbs || 0,
          fat: fat || 0,
          portion,
          category,
        },
        $inc: { usageCount: 1 },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error("Food favorite create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/foods/favorites - Favori sil
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get("id");

    if (!favoriteId) {
      return NextResponse.json({ error: "id gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const client = await Client.findOne({ userId: session.user.id });
    if (!client) {
      return NextResponse.json(
        { error: "Danışan bulunamadı" },
        { status: 404 },
      );
    }

    const favorite = await FoodFavorite.findOne({
      _id: favoriteId,
      clientId: client._id,
    });
    if (!favorite) {
      return NextResponse.json({ error: "Favori bulunamadı" }, { status: 404 });
    }

    await FoodFavorite.deleteOne({ _id: favoriteId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Food favorite delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
