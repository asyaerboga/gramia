import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/gramia";

// ---- Şemalar ----
const UserSchema = new mongoose.Schema({ name: String, email: String });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ClientSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, dietitianId: mongoose.Schema.Types.ObjectId });
const Client = mongoose.models.Client || mongoose.model("Client", ClientSchema);

const MealItemSchema = new mongoose.Schema({
  name: String,
  calories: Number,
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  portion: String,
});

const MealSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    items: [MealItemSchema],
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    notes: String,
  },
  { timestamps: true }
);

MealSchema.pre("save", function () {
  this.totalCalories = this.items.reduce((s, i) => s + i.calories, 0);
  this.totalProtein = this.items.reduce((s, i) => s + (i.protein || 0), 0);
  this.totalCarbs = this.items.reduce((s, i) => s + (i.carbs || 0), 0);
  this.totalFat = this.items.reduce((s, i) => s + (i.fat || 0), 0);
});

const Meal = mongoose.models.Meal || mongoose.model("Meal", MealSchema);

// ---- Örnek yemek verileri ----
const MEALS = {
  breakfast: [
    { name: "Yulaf ezmesi", calories: 150, protein: 6, carbs: 27, fat: 3, portion: "1 kase" },
    { name: "Haşlanmış yumurta", calories: 78, protein: 6, carbs: 1, fat: 5, portion: "1 adet" },
    { name: "Tam buğday ekmeği", calories: 80, protein: 3, carbs: 15, fat: 1, portion: "1 dilim" },
    { name: "Beyaz peynir", calories: 75, protein: 5, carbs: 1, fat: 6, portion: "30 g" },
    { name: "Domates", calories: 18, protein: 1, carbs: 4, fat: 0, portion: "1 adet" },
    { name: "Salatalık", calories: 10, protein: 0, carbs: 2, fat: 0, portion: "yarım adet" },
  ],
  lunch: [
    { name: "Izgara tavuk göğsü", calories: 165, protein: 31, carbs: 0, fat: 4, portion: "150 g" },
    { name: "Bulgur pilavı", calories: 190, protein: 5, carbs: 39, fat: 1, portion: "1 porsiyon" },
    { name: "Yeşil salata", calories: 40, protein: 2, carbs: 7, fat: 1, portion: "1 kase" },
    { name: "Zeytinyağlı mercimek çorbası", calories: 130, protein: 8, carbs: 20, fat: 3, portion: "1 kase" },
  ],
  dinner: [
    { name: "Kırmızı mercimek köftesi", calories: 180, protein: 10, carbs: 28, fat: 4, portion: "6 adet" },
    { name: "Zeytinyağlı fasulye", calories: 160, protein: 6, carbs: 22, fat: 6, portion: "1 porsiyon" },
    { name: "Yoğurt", calories: 60, protein: 4, carbs: 5, fat: 2, portion: "100 g" },
    { name: "Sebze çorbası", calories: 80, protein: 3, carbs: 12, fat: 2, portion: "1 kase" },
    { name: "Tam buğday ekmeği", calories: 80, protein: 3, carbs: 15, fat: 1, portion: "1 dilim" },
  ],
  snack: [
    { name: "Elma", calories: 52, protein: 0, carbs: 14, fat: 0, portion: "1 adet" },
    { name: "Ceviz", calories: 130, protein: 3, carbs: 3, fat: 13, portion: "3 adet" },
    { name: "Kefir", calories: 70, protein: 4, carbs: 8, fat: 2, portion: "200 ml" },
  ],
};

// ---- Tarih yardımcısı ----
function dateRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// ---- Ana fonksiyon ----
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB bağlandı.");

  // Kullanıcıyı bul
  const user = await User.findOne({ name: /Begüm Doğan/i });
  if (!user) {
    console.error("'Begüm Doğan' adlı kullanıcı bulunamadı.");
    process.exit(1);
  }
  console.log(`Kullanıcı bulundu: ${user.name} (${user._id})`);

  // Danışan kaydını bul
  const client = await Client.findOne({ userId: user._id });
  if (!client) {
    console.error("Danışan kaydı bulunamadı.");
    process.exit(1);
  }
  console.log(`Danışan bulundu: ${client._id}`);

  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-06-13");
  const dates = dateRange(startDate, endDate);

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

  let insertedCount = 0;
  let skippedCount = 0;

  for (const date of dates) {
    for (const mealType of mealTypes) {
      // Aynı gün aynı öğün zaten var mı kontrol et
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const exists = await Meal.findOne({
        clientId: client._id,
        mealType,
        date: { $gte: dayStart, $lte: dayEnd },
      });

      if (exists) {
        skippedCount++;
        continue;
      }

      const items = MEALS[mealType];
      const meal = new Meal({
        clientId: client._id,
        date: new Date(date.setHours(
          mealType === "breakfast" ? 8 :
          mealType === "lunch" ? 12 :
          mealType === "dinner" ? 19 : 16,
          0, 0, 0
        )),
        mealType,
        items,
      });
      await meal.save();
      insertedCount++;
    }
  }

  console.log(`\nTamamlandı:`);
  console.log(`  Eklenen öğün: ${insertedCount}`);
  console.log(`  Atlanan (zaten var): ${skippedCount}`);
  console.log(`  Toplam gün: ${dates.length}, öğün/gün: 4`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
