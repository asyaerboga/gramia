import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/gramia";

const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({ name: String }));
const Client = mongoose.models.Client || mongoose.model("Client", new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }));

const MealSatietySchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    satietyLevel: { type: Number, min: 1, max: 5, required: true },
    notes: String,
  },
  { timestamps: true }
);
MealSatietySchema.index({ clientId: 1, date: 1, mealType: 1 }, { unique: true });
const MealSatiety = mongoose.models.MealSatiety || mongoose.model("MealSatiety", MealSatietySchema);

// Öğün tipine göre tokluk seviyesi ağırlıkları (1-5 arası, gerçekçi dağılım)
const SATIETY_WEIGHTS = {
  breakfast: [1, 2, 3, 3, 4, 4, 4, 5, 5],   // Kahvaltı: genelde iyi tokluk
  lunch:     [2, 3, 3, 4, 4, 4, 5, 5, 5],   // Öğle: en tok hissedilen öğün
  dinner:    [2, 3, 3, 3, 4, 4, 4, 5],       // Akşam: orta-iyi tokluk
  snack:     [1, 2, 2, 3, 3, 3, 4],          // Atıştırmalık: hafif tokluk
};

function randomSatiety(mealType) {
  const w = SATIETY_WEIGHTS[mealType];
  return w[Math.floor(Math.random() * w.length)];
}

function dateRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB bağlandı.");

  const user = await User.findOne({ name: /Begüm Doğan/i });
  if (!user) { console.error("Kullanıcı bulunamadı."); process.exit(1); }
  console.log(`Kullanıcı: ${user.name} (${user._id})`);

  const client = await Client.findOne({ userId: user._id });
  if (!client) { console.error("Danışan kaydı bulunamadı."); process.exit(1); }
  console.log(`Danışan: ${client._id}`);

  const dates = dateRange(new Date("2026-01-01"), new Date("2026-06-13"));
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

  let inserted = 0;
  let skipped = 0;

  for (const date of dates) {
    for (const mealType of mealTypes) {
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

      const exists = await MealSatiety.findOne({
        clientId: client._id, mealType,
        date: { $gte: dayStart, $lte: dayEnd },
      });
      if (exists) { skipped++; continue; }

      const hour = mealType === "breakfast" ? 9 : mealType === "lunch" ? 13 : mealType === "dinner" ? 20 : 17;
      await MealSatiety.create({
        clientId: client._id,
        date: new Date(new Date(date).setHours(hour, 0, 0, 0)),
        mealType,
        satietyLevel: randomSatiety(mealType),
      });
      inserted++;
    }
  }

  console.log(`\nTamamlandı:`);
  console.log(`  Eklenen kayıt : ${inserted}`);
  console.log(`  Atlanan (var) : ${skipped}`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
