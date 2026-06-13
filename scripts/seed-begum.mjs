import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017/gramia";

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("gramia");

  // Begüm Doğan kullanıcısını bul
  const user = await db.collection("users").findOne({ name: /Begüm/i });
  if (!user) {
    console.error("Begüm Doğan kullanıcısı bulunamadı!");
    await client.close();
    return;
  }
  console.log("Kullanıcı bulundu:", user.name, user._id.toString());

  // Client kaydını bul
  const clientDoc = await db.collection("clients").findOne({ userId: user._id });
  if (!clientDoc) {
    console.error("Client kaydı bulunamadı!");
    await client.close();
    return;
  }
  console.log("Client bulundu:", clientDoc._id.toString());

  const clientId = clientDoc._id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Yemek ekle (öğle yemeği)
  const mealDate = new Date(today);
  mealDate.setHours(12, 0, 0, 0);

  const mealItems = [
    { name: "Izgara Tavuk", calories: 200, protein: 38, carbs: 0, fat: 4, portion: "150g" },
    { name: "Bulgur Pilavı", calories: 180, protein: 6, carbs: 36, fat: 2, portion: "1 porsiyon" },
    { name: "Cacık", calories: 60, protein: 3, carbs: 4, fat: 3, portion: "1 kase" },
  ];

  const totalCalories = mealItems.reduce((s, i) => s + i.calories, 0);
  const totalProtein = mealItems.reduce((s, i) => s + (i.protein || 0), 0);
  const totalCarbs = mealItems.reduce((s, i) => s + (i.carbs || 0), 0);
  const totalFat = mealItems.reduce((s, i) => s + (i.fat || 0), 0);

  const mealResult = await db.collection("meals").insertOne({
    clientId,
    date: mealDate,
    mealType: "lunch",
    items: mealItems,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("Yemek eklendi:", mealResult.insertedId.toString());

  // 2. Egzersiz ekle
  const exerciseDate = new Date(today);
  exerciseDate.setHours(12, 0, 0, 0);

  const exerciseResult = await db.collection("exercises").insertOne({
    clientId,
    date: exerciseDate,
    type: "cardio",
    name: "Tempolu Yürüyüş",
    duration: 30,
    caloriesBurned: 150,
    intensity: "medium",
    notes: "Sabah parkta 30 dakika tempolu yürüyüş",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("Egzersiz eklendi:", exerciseResult.insertedId.toString());

  // 3. Ruh hali / Check-in ekle
  const checkinResult = await db.collection("checkins").findOneAndUpdate(
    { clientId, date: today },
    {
      $set: {
        clientId,
        date: today,
        mood: 4,
        energyLevel: 4,
        stressLevel: 2,
        hungerLevel: 3,
        symptoms: [],
        notes: "Bugün kendimi iyi hissediyorum.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log("Ruh hali kaydı eklendi:", checkinResult?._id?.toString() ?? "upserted");

  // 4. Uyku kaydı ekle
  const bedTime = "23:00";
  const wakeTime = "07:00";
  const [bedH, bedM] = bedTime.split(":").map(Number);
  const [wakeH, wakeM] = wakeTime.split(":").map(Number);
  let duration = wakeH * 60 + wakeM - (bedH * 60 + bedM);
  if (duration < 0) duration += 24 * 60;
  duration = Math.round((duration / 60) * 10) / 10;

  const sleepResult = await db.collection("sleeps").findOneAndUpdate(
    { clientId, date: today },
    {
      $set: {
        clientId,
        date: today,
        bedTime,
        wakeTime,
        duration,
        quality: 4,
        notes: "Rahat bir uyku",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log("Uyku kaydı eklendi:", sleepResult?._id?.toString() ?? "upserted");

  await client.close();
  console.log("\nTüm kayıtlar başarıyla eklendi!");
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
