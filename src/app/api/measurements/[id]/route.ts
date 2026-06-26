import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Measurement from "@/lib/models/Measurement";
import Client from "@/lib/models/Client";
import { requireSession, withDb } from "@/lib/apiHelpers";

async function findOwnedMeasurement(id: string, dietitianId: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const measurement = await Measurement.findById(id);
  if (!measurement) return null;
  const client = await Client.findOne({ _id: measurement.clientId, dietitianId });
  if (!client) return null;
  return measurement;
}

async function syncClientWeightToLatest(clientId: mongoose.Types.ObjectId) {
  const latest = await Measurement.findOne({
    clientId,
    weight: { $exists: true, $ne: null },
  }).sort({ date: -1 });
  if (latest?.weight != null) {
    await Client.findByIdAndUpdate(clientId, { $set: { weight: latest.weight } });
  }
}

// PATCH /api/measurements/[id] - Update a measurement record (dietitian only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireSession("dietitian");
    if (error) return error;

    const { id } = await params;
    await withDb();

    const measurement = await findOwnedMeasurement(id, session.user.id);
    if (!measurement) {
      return NextResponse.json({ error: "Ölçüm kaydı bulunamadı" }, { status: 404 });
    }

    const { date, regions, weight, height } = await request.json();

    if (date) measurement.date = new Date(date);
    if (regions) measurement.regions = regions;
    if (weight !== undefined) measurement.weight = weight === null ? undefined : weight;
    if (height !== undefined) measurement.height = height === null ? undefined : height;

    await measurement.save();
    await syncClientWeightToLatest(measurement.clientId);

    return NextResponse.json(measurement);
  } catch (error) {
    console.error("Update measurement error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/measurements/[id] - Delete a measurement record (dietitian only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireSession("dietitian");
    if (error) return error;

    const { id } = await params;
    await withDb();

    const measurement = await findOwnedMeasurement(id, session.user.id);
    if (!measurement) {
      return NextResponse.json({ error: "Ölçüm kaydı bulunamadı" }, { status: 404 });
    }

    const clientId = measurement.clientId;
    await measurement.deleteOne();
    await syncClientWeightToLatest(clientId);

    return NextResponse.json({ message: "Ölçüm kaydı silindi" });
  } catch (error) {
    console.error("Delete measurement error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
