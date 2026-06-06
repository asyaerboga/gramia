// @ts-nocheck
/* eslint-disable */
/**
 * Seed script: mevcut tüm danışanlar için gerçekçi sunum verisi oluşturur.
 * Çalıştırma: node scripts/seed-client-data.js
 */

const mongoose = require("mongoose");

// .env dosyasını manuel oku
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
if (!MONGODB_URI) {
  console.error("MONGODB_URI tanımlı değil");
  process.exit(1);
}

// ─── Şemalar (modeller TS'den derlenmeden direkt tanımlanıyor) ──────────────

const UserSchema = new mongoose.Schema({ name: String, email: String, password: String, role: String, image: String, phone: String, gender: String }, { timestamps: true });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ClientSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  dietitianId: mongoose.Schema.Types.ObjectId,
  age: Number, height: Number, weight: Number, targetWeight: Number, startWeight: Number,
  chronicDiseases: [String], gender: String, activityLevel: String,
  targetCalories: Number, targetProtein: Number, targetCarbs: Number, targetFat: Number,
  targetWater: Number, birthDate: Date, phone: String, address: String, occupation: String,
  allergies: [String], medications: [String], goals: [String],
  loginStreak: Number, lastLoginDate: Date, totalPoints: Number,
}, { timestamps: true });
const Client = mongoose.models.Client || mongoose.model("Client", ClientSchema);

const MealSchema = new mongoose.Schema({
  clientId: mongoose.Schema.Types.ObjectId,
  date: Date, mealType: String,
  items: [{ name: String, calories: Number, protein: Number, carbs: Number, fat: Number, portion: String }],
  totalCalories: Number, totalProtein: Number, totalCarbs: Number, totalFat: Number, notes: String,
}, { timestamps: true });
const Meal = mongoose.models.Meal || mongoose.model("Meal", MealSchema);

const ExerciseSchema = new mongoose.Schema({
  clientId: mongoose.Schema.Types.ObjectId,
  date: Date, type: String, name: String, duration: Number,
  caloriesBurned: Number, intensity: String, notes: String,
}, { timestamps: true });
const Exercise = mongoose.models.Exercise || mongoose.model("Exercise", ExerciseSchema);

const WaterIntakeSchema = new mongoose.Schema({
  clientId: mongoose.Schema.Types.ObjectId,
  date: Date, amount: Number,
}, { timestamps: true });
const WaterIntake = mongoose.models.WaterIntake || mongoose.model("WaterIntake", WaterIntakeSchema);

const MeasurementSchema = new mongoose.Schema({
  clientId: mongoose.Schema.Types.ObjectId,
  date: Date, weight: Number, height: Number,
  regions: { neck: Number, chest: Number, waist: Number, hip: Number, arm: Number, thigh: Number, calf: Number },
}, { timestamps: true });
const Measurement = mongoose.models.Measurement || mongoose.model("Measurement", MeasurementSchema);

const SleepSchema = new mongoose.Schema({
  clientId: mongoose.Schema.Types.ObjectId,
  date: Date, bedTime: String, wakeTime: String, duration: Number, quality: Number, notes: String,
}, { timestamps: true });
// unique index kaldırıldı (seed yeniden çalıştırılabilsin diye)
const Sleep = mongoose.models.Sleep || mongoose.model("Sleep", SleepSchema);

const CheckInSchema = new mongoose.Schema({
  clientId: mongoose.Schema.Types.ObjectId,
  date: Date, mood: Number, energyLevel: Number, stressLevel: Number,
  hungerLevel: Number, symptoms: [String], notes: String,
}, { timestamps: true });
const CheckIn = mongoose.models.CheckIn || mongoose.model("CheckIn", CheckInSchema);

const AppointmentSchema = new mongoose.Schema({
  clientId: mongoose.Schema.Types.ObjectId,
  dietitianId: mongoose.Schema.Types.ObjectId,
  date: Date, time: String,
  status: { type: String, default: "confirmed" },
  notes: String,
}, { timestamps: true });
const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

// ─── Yardımcı fonksiyonlar ──────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Veri şablonları ────────────────────────────────────────────────────────

const BREAKFASTS = [
  {
    items: [
      { name: "Yulaf ezmesi", calories: 150, protein: 5, carbs: 27, fat: 3, portion: "1 kase" },
      { name: "Muz", calories: 89, protein: 1, carbs: 23, fat: 0, portion: "1 adet" },
      { name: "Fıstık ezmesi", calories: 95, protein: 4, carbs: 3, fat: 8, portion: "1 yemek kaşığı" },
    ],
  },
  {
    items: [
      { name: "Tam buğday ekmek", calories: 140, protein: 6, carbs: 26, fat: 2, portion: "2 dilim" },
      { name: "Yumurta (haşlanmış)", calories: 78, protein: 6, carbs: 1, fat: 5, portion: "2 adet" },
      { name: "Domates", calories: 18, protein: 1, carbs: 4, fat: 0, portion: "1 adet" },
      { name: "Beyaz peynir", calories: 75, protein: 5, carbs: 1, fat: 6, portion: "30g" },
    ],
  },
  {
    items: [
      { name: "Yoğurt", calories: 130, protein: 8, carbs: 12, fat: 5, portion: "200g" },
      { name: "Granola", calories: 120, protein: 3, carbs: 22, fat: 3, portion: "30g" },
      { name: "Çilek", calories: 49, protein: 1, carbs: 12, fat: 0, portion: "100g" },
    ],
  },
  {
    items: [
      { name: "Menemen (2 yumurtalı)", calories: 220, protein: 14, carbs: 8, fat: 14, portion: "1 porsiyon" },
      { name: "Tam buğday ekmek", calories: 70, protein: 3, carbs: 13, fat: 1, portion: "1 dilim" },
      { name: "Zeytin", calories: 50, protein: 0, carbs: 1, fat: 5, portion: "5 adet" },
    ],
  },
];

const LUNCHES = [
  {
    items: [
      { name: "Izgara tavuk göğsü", calories: 165, protein: 31, carbs: 0, fat: 4, portion: "150g" },
      { name: "Bulgur pilavı", calories: 190, protein: 6, carbs: 38, fat: 2, portion: "1 kase" },
      { name: "Mevsim salatası", calories: 55, protein: 2, carbs: 8, fat: 2, portion: "1 tabak" },
      { name: "Ayran", calories: 60, protein: 3, carbs: 5, fat: 3, portion: "200ml" },
    ],
  },
  {
    items: [
      { name: "Mercimek çorbası", calories: 160, protein: 9, carbs: 25, fat: 3, portion: "1 kase" },
      { name: "Kıymalı pide", calories: 280, protein: 18, carbs: 32, fat: 9, portion: "1 adet" },
      { name: "Cacık", calories: 70, protein: 3, carbs: 4, fat: 5, portion: "100g" },
    ],
  },
  {
    items: [
      { name: "Fırın somon", calories: 208, protein: 29, carbs: 0, fat: 10, portion: "150g" },
      { name: "Haşlanmış brokoli", calories: 55, protein: 4, carbs: 10, fat: 1, portion: "150g" },
      { name: "Esmer pirinç", calories: 215, protein: 5, carbs: 45, fat: 2, portion: "1 kase" },
    ],
  },
  {
    items: [
      { name: "Tavuk çorbası", calories: 120, protein: 10, carbs: 8, fat: 5, portion: "1 kase" },
      { name: "Sebzeli makarna", calories: 320, protein: 12, carbs: 55, fat: 6, portion: "1 porsiyon" },
      { name: "Meyve salatası", calories: 80, protein: 1, carbs: 20, fat: 0, portion: "1 kase" },
    ],
  },
  {
    items: [
      { name: "Köfte (ızgara)", calories: 250, protein: 22, carbs: 5, fat: 15, portion: "4 adet" },
      { name: "Közlenmiş sebze", calories: 90, protein: 3, carbs: 15, fat: 3, portion: "1 porsiyon" },
      { name: "Yoğurt", calories: 65, protein: 4, carbs: 5, fat: 3, portion: "100g" },
    ],
  },
];

const DINNERS = [
  {
    items: [
      { name: "Kuru fasulye", calories: 330, protein: 20, carbs: 55, fat: 3, portion: "1 porsiyon" },
      { name: "Pirinç pilavı", calories: 200, protein: 4, carbs: 43, fat: 1, portion: "1 kase" },
      { name: "Turşu", calories: 15, protein: 0, carbs: 3, fat: 0, portion: "2 yemek kaşığı" },
    ],
  },
  {
    items: [
      { name: "Tavuk sote", calories: 240, protein: 28, carbs: 10, fat: 9, portion: "1 porsiyon" },
      { name: "Haşlanmış patates", calories: 130, protein: 3, carbs: 30, fat: 0, portion: "150g" },
      { name: "Yoğurt", calories: 65, protein: 4, carbs: 5, fat: 3, portion: "100g" },
    ],
  },
  {
    items: [
      { name: "Zeytinyağlı taze fasulye", calories: 180, protein: 6, carbs: 25, fat: 8, portion: "1 porsiyon" },
      { name: "Fırın köfte", calories: 200, protein: 18, carbs: 4, fat: 12, portion: "3 adet" },
      { name: "Cacık", calories: 70, protein: 3, carbs: 4, fat: 5, portion: "100g" },
    ],
  },
  {
    items: [
      { name: "Balık (levrek)", calories: 190, protein: 26, carbs: 0, fat: 9, portion: "150g" },
      { name: "Zeytinyağlı sebze", calories: 110, protein: 3, carbs: 12, fat: 6, portion: "1 porsiyon" },
      { name: "Bulgur pilavı", calories: 150, protein: 5, carbs: 30, fat: 2, portion: "yarım kase" },
    ],
  },
];

const SNACKS = [
  { items: [{ name: "Elma", calories: 95, protein: 0, carbs: 25, fat: 0, portion: "1 adet" }] },
  { items: [{ name: "Ceviz", calories: 98, protein: 2, carbs: 2, fat: 10, portion: "4 adet" }, { name: "Kuru üzüm", calories: 42, protein: 0, carbs: 11, fat: 0, portion: "1 yemek kaşığı" }] },
  { items: [{ name: "Yoğurt", calories: 100, protein: 6, carbs: 8, fat: 4, portion: "150g" }, { name: "Bal", calories: 21, protein: 0, carbs: 6, fat: 0, portion: "1 çay kaşığı" }] },
  { items: [{ name: "Badem", calories: 87, protein: 3, carbs: 3, fat: 7, portion: "15 adet" }] },
  { items: [{ name: "Muz", calories: 89, protein: 1, carbs: 23, fat: 0, portion: "1 adet" }] },
];

const EXERCISES = [
  { type: "cardio", name: "Koşu bandı", duration: 30, caloriesBurned: 280, intensity: "medium" },
  { type: "cardio", name: "Yürüyüş (açık hava)", duration: 45, caloriesBurned: 200, intensity: "low" },
  { type: "strength", name: "Üst vücut antrenmanı", duration: 40, caloriesBurned: 220, intensity: "high" },
  { type: "strength", name: "Bacak antrenmanı", duration: 45, caloriesBurned: 260, intensity: "high" },
  { type: "cardio", name: "Bisiklet (sabit)", duration: 35, caloriesBurned: 240, intensity: "medium" },
  { type: "flexibility", name: "Yoga", duration: 50, caloriesBurned: 130, intensity: "low" },
  { type: "strength", name: "Core antrenmanı", duration: 25, caloriesBurned: 150, intensity: "medium" },
  { type: "cardio", name: "HIIT antrenmanı", duration: 20, caloriesBurned: 300, intensity: "high" },
  { type: "strength", name: "Tüm vücut antrenmanı", duration: 60, caloriesBurned: 350, intensity: "high" },
  { type: "flexibility", name: "Pilates", duration: 55, caloriesBurned: 160, intensity: "low" },
];

const SLEEP_DATA = [
  { bedTime: "22:30", wakeTime: "06:30", duration: 8, quality: 5 },
  { bedTime: "23:00", wakeTime: "07:00", duration: 8, quality: 4 },
  { bedTime: "23:30", wakeTime: "07:30", duration: 8, quality: 4 },
  { bedTime: "00:00", wakeTime: "07:00", duration: 7, quality: 3 },
  { bedTime: "22:00", wakeTime: "06:00", duration: 8, quality: 5 },
  { bedTime: "23:45", wakeTime: "07:15", duration: 7.5, quality: 3 },
  { bedTime: "23:00", wakeTime: "06:30", duration: 7.5, quality: 4 },
];

const CHECK_IN_DATA = [
  { mood: 5, energyLevel: 4, stressLevel: 2, hungerLevel: 3, notes: "Bugün çok enerjikydim, harika bir gün!" },
  { mood: 4, energyLevel: 4, stressLevel: 2, hungerLevel: 3, notes: "İyi bir gündü, antrenman harika geçti." },
  { mood: 3, energyLevel: 3, stressLevel: 3, hungerLevel: 4, notes: "Orta hissediyorum, biraz yorgundum." },
  { mood: 4, energyLevel: 5, stressLevel: 2, hungerLevel: 2, notes: "Harika uyudum, kendimi taze hissediyorum." },
  { mood: 2, energyLevel: 2, stressLevel: 4, hungerLevel: 4, symptoms: ["baş ağrısı"], notes: "Bugün biraz kötü hissettim." },
  { mood: 5, energyLevel: 5, stressLevel: 1, hungerLevel: 2, notes: "Mükemmel bir gün! Hedeflerime odaklandım." },
  { mood: 4, energyLevel: 3, stressLevel: 3, hungerLevel: 3 },
  { mood: 3, energyLevel: 4, stressLevel: 2, hungerLevel: 3, notes: "Yoga sonrası çok rahatladım." },
  { mood: 4, energyLevel: 4, stressLevel: 2, hungerLevel: 4, notes: "Güzel bir gündü." },
  { mood: 5, energyLevel: 4, stressLevel: 1, hungerLevel: 3, notes: "Diyetime sıkı sıkıya uymak harika hissettiriyor!" },
];

// ─── Totaller hesaplama ────────────────────────────────────────────────────

function calcTotals(items) {
  return {
    totalCalories: items.reduce((s, i) => s + i.calories, 0),
    totalProtein: items.reduce((s, i) => s + (i.protein || 0), 0),
    totalCarbs: items.reduce((s, i) => s + (i.carbs || 0), 0),
    totalFat: items.reduce((s, i) => s + (i.fat || 0), 0),
  };
}

// ─── Ana seed fonksiyonu ──────────────────────────────────────────────────

async function seedClient(client) {
  const clientId = client._id;
  console.log(`  → Danışan ID: ${clientId}`);

  // Mevcut verileri temizle
  await Promise.all([
    Meal.deleteMany({ clientId }),
    Exercise.deleteMany({ clientId }),
    WaterIntake.deleteMany({ clientId }),
    Sleep.deleteMany({ clientId }),
    CheckIn.deleteMany({ clientId }),
    Measurement.deleteMany({ clientId }),
    Appointment.deleteMany({ clientId }),
  ]);

  const meals = [];
  const exercises = [];
  const waterIntakes = [];
  const sleepRecords = [];
  const checkIns = [];
  const measurements = [];

  // 14 günlük veri (geçmişe doğru)
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const date = daysAgo(dayOffset);

    // ── Öğünler ──
    const breakfast = pick(BREAKFASTS);
    meals.push({ clientId, date, mealType: "breakfast", items: breakfast.items, ...calcTotals(breakfast.items) });

    const lunch = pick(LUNCHES);
    meals.push({ clientId, date, mealType: "lunch", items: lunch.items, ...calcTotals(lunch.items) });

    const dinner = pick(DINNERS);
    meals.push({ clientId, date, mealType: "dinner", items: dinner.items, ...calcTotals(dinner.items) });

    // Ara öğün (her gün değil)
    if (dayOffset % 2 === 0) {
      const snack = pick(SNACKS);
      meals.push({ clientId, date, mealType: "snack", items: snack.items, ...calcTotals(snack.items) });
    }

    // ── Egzersiz (haftada ~5 gün) ──
    if (dayOffset % 3 !== 1) {
      const ex = { ...pick(EXERCISES) };
      exercises.push({ clientId, date, ...ex });
    }

    // ── Su tüketimi ──
    const waterAmount = rand(16, 24) * 100; // 1600-2400ml
    waterIntakes.push({ clientId, date, amount: waterAmount });

    // ── Uyku ──
    const sleep = pick(SLEEP_DATA);
    sleepRecords.push({ clientId, date, ...sleep });

    // ── Check-in ──
    const checkIn = { ...pick(CHECK_IN_DATA) };
    checkIns.push({ clientId, date, ...checkIn });

    // ── Ölçümler (haftada bir) ──
    if (dayOffset % 7 === 0 || dayOffset === 13 || dayOffset === 0) {
      const weekNum = Math.floor(dayOffset / 7);
      const baseWeight = client.startWeight || (client.weight + 3);
      const weight = parseFloat((baseWeight - weekNum * 0.8 + (Math.random() - 0.5) * 0.4).toFixed(1));
      measurements.push({
        clientId,
        date,
        weight,
        height: client.height || 170,
        regions: {
          neck: rand(32, 38),
          chest: rand(88, 98),
          waist: rand(72, 85),
          hip: rand(90, 100),
          arm: rand(28, 35),
          thigh: rand(52, 62),
          calf: rand(34, 40),
        },
      });
    }
  }

  // ── Randevular ──
  const appointments = [
    {
      clientId,
      dietitianId: client.dietitianId,
      date: daysAgo(10),
      time: "10:00",
      status: "completed",
      notes: "İlk görüşme. Beslenme alışkanlıkları değerlendirildi, hedefler belirlendi.",
    },
    {
      clientId,
      dietitianId: client.dietitianId,
      date: daysAgo(3),
      time: "11:00",
      status: "completed",
      notes: "2. hafta takibi. Kilo kaybı hedefte, motivasyon yüksek.",
    },
    {
      clientId,
      dietitianId: client.dietitianId,
      date: daysFromNow(4),
      time: "14:00",
      status: "confirmed",
      notes: "3. hafta kontrolü.",
    },
    {
      clientId,
      dietitianId: client.dietitianId,
      date: daysFromNow(11),
      time: "10:30",
      status: "pending",
    },
  ];

  // Kaydet
  await Promise.all([
    Meal.insertMany(meals),
    Exercise.insertMany(exercises),
    WaterIntake.insertMany(waterIntakes),
    Sleep.insertMany(sleepRecords),
    CheckIn.insertMany(checkIns),
    Measurement.insertMany(measurements),
    Appointment.insertMany(appointments),
  ]);

  // Client profilini güncelle
  await Client.findByIdAndUpdate(clientId, {
    $set: {
      targetCalories: 1800,
      targetProtein: 120,
      targetCarbs: 200,
      targetFat: 60,
      targetWater: 2.0,
      loginStreak: rand(5, 14),
      totalPoints: rand(250, 600),
      activityLevel: pick(["moderate", "active", "light"]),
      goals: ["Kilo vermek", "Daha sağlıklı beslenmek", "Enerji seviyesini artırmak"],
    },
  });

  console.log(`     ✓ ${meals.length} öğün | ${exercises.length} egzersiz | ${measurements.length} ölçüm | ${appointments.length} randevu eklendi`);
}

async function main() {
  console.log("MongoDB'ye bağlanılıyor...");
  await mongoose.connect(MONGODB_URI);
  console.log("Bağlantı başarılı.\n");

  const clients = await Client.find({});
  console.log(`${clients.length} danışan bulundu.\n`);

  if (clients.length === 0) {
    console.log("Hiç danışan yok. Önce danışan kaydı oluşturun.");
    process.exit(0);
  }

  for (const client of clients) {
    await seedClient(client);
  }

  console.log("\nSeed tamamlandı!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
