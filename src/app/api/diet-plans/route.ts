import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DietPlan from "@/lib/models/DietPlan";
import Client from "@/lib/models/Client";

// GET /api/diet-plans - Beslenme planlarını getir
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = {};

    if (session.user.role === "dietitian") {
      // Diyetisyen tüm kendi planlarını görebilir
      query.dietitianId = session.user.id;
      if (clientId) query.clientId = clientId;
    } else {
      // Client sadece kendine atanmış planları görebilir
      const client = await Client.findOne({ userId: session.user.id });
      if (!client) {
        return NextResponse.json(
          { error: "Danışan bulunamadı" },
          { status: 404 },
        );
      }
      query.clientId = client._id;
    }

    if (activeOnly) query.isActive = true;

    const plans = await DietPlan.find(query)
      .populate("clientId", "userId")
      .sort({ createdAt: -1 });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Diet plan fetch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/diet-plans - Yeni beslenme planı oluştur
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const {
      clientId,
      name,
      description,
      startDate,
      endDate,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      weeklyPlan,
      notes,
    } = body;

    if (!clientId || !name || !startDate || !targetCalories) {
      return NextResponse.json(
        { error: "clientId, name, startDate ve targetCalories gereklidir" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Diyetisyenin danışanı mı kontrol et
    const client = await Client.findById(clientId);
    if (!client || client.dietitianId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    // Önce diğer aktif planları pasif yap
    await DietPlan.updateMany(
      { clientId, isActive: true },
      { $set: { isActive: false } },
    );

    // Boş haftalık plan şablonu
    const emptyDayPlan = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };

    const defaultWeeklyPlan = {
      monday: emptyDayPlan,
      tuesday: emptyDayPlan,
      wednesday: emptyDayPlan,
      thursday: emptyDayPlan,
      friday: emptyDayPlan,
      saturday: emptyDayPlan,
      sunday: emptyDayPlan,
    };

    const plan = await DietPlan.create({
      clientId,
      dietitianId: session.user.id,
      name,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: true,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      weeklyPlan: weeklyPlan || defaultWeeklyPlan,
      notes,
    });

    // Client hedeflerini de güncelle
    client.targetCalories = targetCalories;
    if (targetProtein) client.targetProtein = targetProtein;
    if (targetCarbs) client.targetCarbs = targetCarbs;
    if (targetFat) client.targetFat = targetFat;
    await client.save();

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Diet plan create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH /api/diet-plans - Plan güncelle
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { planId, ...updates } = body;

    if (!planId) {
      return NextResponse.json({ error: "planId gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const plan = await DietPlan.findById(planId);
    if (!plan || plan.dietitianId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    // Aktif yapılıyorsa diğerlerini pasif yap
    if (updates.isActive === true) {
      await DietPlan.updateMany(
        { clientId: plan.clientId, isActive: true, _id: { $ne: planId } },
        { $set: { isActive: false } },
      );
    }

    Object.assign(plan, updates);
    await plan.save();

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Diet plan update error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/diet-plans - Plan sil
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "dietitian") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("id");

    if (!planId) {
      return NextResponse.json({ error: "id gereklidir" }, { status: 400 });
    }

    await dbConnect();

    const plan = await DietPlan.findById(planId);
    if (!plan || plan.dietitianId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await DietPlan.deleteOne({ _id: planId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Diet plan delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
