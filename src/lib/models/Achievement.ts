import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Başarı tanımları
export const ACHIEVEMENT_DEFINITIONS = {
  // Streak başarıları
  STREAK_7: {
    id: "streak_7",
    name: "Haftalık Kararlılık",
    description: "7 gün üst üste giriş yaptın",
    icon: "🔥",
    points: 50,
  },
  STREAK_30: {
    id: "streak_30",
    name: "Aylık Azim",
    description: "30 gün üst üste giriş yaptın",
    icon: "⚡",
    points: 200,
  },
  STREAK_100: {
    id: "streak_100",
    name: "Süper Disiplin",
    description: "100 gün üst üste giriş yaptın",
    icon: "🏆",
    points: 500,
  },

  // Kilo hedefleri
  WEIGHT_LOST_1: {
    id: "weight_lost_1",
    name: "İlk Adım",
    description: "İlk 1 kg'ı verdin",
    icon: "🎯",
    points: 25,
  },
  WEIGHT_LOST_5: {
    id: "weight_lost_5",
    name: "Kararlı Adımlar",
    description: "5 kg verdin",
    icon: "💪",
    points: 100,
  },
  WEIGHT_LOST_10: {
    id: "weight_lost_10",
    name: "Dönüşüm Başladı",
    description: "10 kg verdin",
    icon: "🌟",
    points: 250,
  },
  GOAL_REACHED: {
    id: "goal_reached",
    name: "Hedef Tamam!",
    description: "Hedef kilona ulaştın",
    icon: "🎉",
    points: 1000,
  },

  // Su takibi
  WATER_DAILY: {
    id: "water_daily",
    name: "Su Perisi",
    description: "Günlük su hedefini tamamladın",
    icon: "💧",
    points: 10,
  },
  WATER_WEEKLY: {
    id: "water_weekly",
    name: "Hidrasyon Ustası",
    description: "7 gün üst üste su hedefini tamamladın",
    icon: "🌊",
    points: 75,
  },

  // Yemek takibi
  MEAL_LOGGED_7: {
    id: "meal_logged_7",
    name: "Düzenli Beslenme",
    description: "7 gün üst üste öğün kaydı girdin",
    icon: "🍽️",
    points: 50,
  },
  MEAL_LOGGED_30: {
    id: "meal_logged_30",
    name: "Beslenme Uzmanı",
    description: "30 gün üst üste öğün kaydı girdin",
    icon: "👨‍🍳",
    points: 200,
  },

  // Egzersiz
  EXERCISE_FIRST: {
    id: "exercise_first",
    name: "İlk Antrenman",
    description: "İlk egzersizini kaydetttin",
    icon: "🏃",
    points: 25,
  },
  EXERCISE_10: {
    id: "exercise_10",
    name: "Aktif Yaşam",
    description: "10 egzersiz kaydı girdin",
    icon: "🏋️",
    points: 100,
  },
  EXERCISE_50: {
    id: "exercise_50",
    name: "Spor Tutkunu",
    description: "50 egzersiz kaydı girdin",
    icon: "🥇",
    points: 300,
  },

  // Ölçüm
  MEASUREMENT_FIRST: {
    id: "measurement_first",
    name: "Takip Başladı",
    description: "İlk ölçümün alındı",
    icon: "📏",
    points: 15,
  },
  MEASUREMENT_10: {
    id: "measurement_10",
    name: "Düzenli Ölçüm",
    description: "10 ölçüm kaydın var",
    icon: "📊",
    points: 75,
  },

  // Mesaj
  MESSAGE_FIRST: {
    id: "message_first",
    name: "İletişim",
    description: "İlk mesajını gönderdin",
    icon: "💬",
    points: 10,
  },

  // Check-in
  CHECKIN_7: {
    id: "checkin_7",
    name: "Farkındalık",
    description: "7 gün üst üste check-in yaptın",
    icon: "🧘",
    points: 50,
  },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENT_DEFINITIONS;

export interface IAchievement extends Document {
  clientId: Types.ObjectId;
  achievementId: string;
  unlockedAt: Date;
  createdAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    achievementId: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Unique: her başarı danışan başına bir kez
AchievementSchema.index({ clientId: 1, achievementId: 1 }, { unique: true });

const Achievement: Model<IAchievement> =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);

export default Achievement;
