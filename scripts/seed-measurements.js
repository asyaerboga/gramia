// @ts-nocheck
/* eslint-disable */
/**
 * Danışanların kilo ve boyuna göre gerçekçi vücut ölçümleri ekler.
 * Çalıştırma: node scripts/seed-measurements.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

try {
  const envFile = fs.readFileSync(path.join(__dirname, "../.env"), "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI tanımlı değil"); process.exit(1); }

const ClientSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  dietitianId: mongoose.Schema.Types.ObjectId,
  age: Number, height: Number, weight: Number, targetWeight: Number, startWeight: Number,
  gender: String,
}, { timestamps: true });
const Client = mongoose.models.Client || mongoose.model("Client", ClientSchema);

const MeasurementSchema = new mongoose.Schema({
  clientId: mongoose.Schema.Types.ObjectId,
  date: Date, weight: Number, height: Number,
  regions: { neck: Number, chest: Number, waist: Number, hip: Number, arm: Number, thigh: Number, calf: Number },
}, { timestamps: true });
const Measurement = mongoose.models.Measurement || mongoose.model("Measurement", MeasurementSchema);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8, 0, 0, 0);
  return d;
}

function jitter(val, range) {
  return parseFloat((val + (Math.random() - 0.5) * range).toFixed(1));
}

/**
 * Kilo/boy/cinsiyete göre gerçekçi bölge ölçümleri hesaplar.
 * BMI bazlı oransal formül kullanır.
 */
function calcRegions(weight, height, gender) {
  const h = height;
  const bmi = weight / Math.pow(h / 100, 2);
  const isMale = gender === "male";
  const bmiRatio = bmi / 22; // 22 = referans normal BMI

  if (isMale) {
    return {
      neck:  Math.round(jitter(0.222 * h * Math.pow(bmiRatio, 0.25), 1.5)),
      chest: Math.round(jitter(0.578 * h * Math.pow(bmiRatio, 0.30), 3.0)),
      waist: Math.round(jitter(0.470 * h * Math.pow(bmiRatio, 0.55), 2.5)),
      hip:   Math.round(jitter(0.548 * h * Math.pow(bmiRatio, 0.35), 2.5)),
      arm:   Math.round(jitter(0.176 * h * Math.pow(bmiRatio, 0.40), 1.5)),
      thigh: Math.round(jitter(0.330 * h * Math.pow(bmiRatio, 0.40), 2.0)),
      calf:  Math.round(jitter(0.220 * h * Math.pow(bmiRatio, 0.35), 1.5)),
    };
  } else {
    return {
      neck:  Math.round(jitter(0.191 * h * Math.pow(bmiRatio, 0.30), 1.0)),
      chest: Math.round(jitter(0.548 * h * Math.pow(bmiRatio, 0.30), 3.0)),
      waist: Math.round(jitter(0.438 * h * Math.pow(bmiRatio, 0.60), 2.5)),
      hip:   Math.round(jitter(0.570 * h * Math.pow(bmiRatio, 0.40), 2.5)),
      arm:   Math.round(jitter(0.164 * h * Math.pow(bmiRatio, 0.40), 1.5)),
      thigh: Math.round(jitter(0.358 * h * Math.pow(bmiRatio, 0.45), 2.0)),
      calf:  Math.round(jitter(0.219 * h * Math.pow(bmiRatio, 0.35), 1.5)),
    };
  }
}

async function seedMeasurements(client) {
  const clientId = client._id;
  const gender = client.gender || "female";
  const height = client.height || 165;
  const currentWeight = client.weight;
  const startWeight = client.startWeight || (currentWeight + 4);

  await Measurement.deleteMany({ clientId });

  const measurements = [];
  // 3 ölçüm noktası: 14 gün önce, 7 gün önce, bugün
  const points = [
    { daysBack: 14, weightOffset: startWeight - currentWeight },
    { daysBack: 7,  weightOffset: (startWeight - currentWeight) / 2 },
    { daysBack: 0,  weightOffset: 0 },
  ];

  for (const pt of points) {
    const w = parseFloat((currentWeight + pt.weightOffset).toFixed(1));
    measurements.push({
      clientId,
      date: daysAgo(pt.daysBack),
      weight: w,
      height,
      regions: calcRegions(w, height, gender),
    });
  }

  await Measurement.insertMany(measurements);
  const bmi = (currentWeight / Math.pow(height / 100, 2)).toFixed(1);
  console.log(`  ✓ ${client.weight}kg / ${height}cm (BMI ${bmi}, ${gender}) → ${measurements.length} ölçüm eklendi`);
}

async function main() {
  console.log("MongoDB'ye bağlanılıyor...");
  await mongoose.connect(MONGODB_URI);
  console.log("Bağlantı başarılı.\n");

  const clients = await Client.find({});
  console.log(`${clients.length} danışan bulundu.\n`);

  if (clients.length === 0) {
    console.log("Hiç danışan yok.");
    process.exit(0);
  }

  for (const client of clients) {
    await seedMeasurements(client);
  }

  console.log("\nTamamlandı.");
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
