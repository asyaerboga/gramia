import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IClient extends Document {
  userId: Types.ObjectId;
  dietitianId: Types.ObjectId;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  startWeight: number;
  chronicDiseases: string[];
  // Yeni alanlar
  gender?: "male" | "female";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetWater?: number;
  birthDate?: Date;
  phone?: string;
  address?: string;
  occupation?: string;
  allergies?: string[];
  medications?: string[];
  goals?: string[];
  loginStreak?: number;
  lastLoginDate?: Date;
  totalPoints?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dietitianId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    age: { type: Number, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    targetWeight: { type: Number, required: true },
    startWeight: { type: Number, required: true },
    chronicDiseases: [{ type: String }],
    // Yeni alanlar
    gender: { type: String, enum: ["male", "female"] },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      default: "moderate",
    },
    targetCalories: { type: Number, default: 1800 },
    targetProtein: { type: Number },
    targetCarbs: { type: Number },
    targetFat: { type: Number },
    targetWater: { type: Number, default: 2.5 },
    birthDate: { type: Date },
    phone: { type: String },
    address: { type: String },
    occupation: { type: String },
    allergies: [{ type: String }],
    medications: [{ type: String }],
    goals: [{ type: String }],
    loginStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

export default Client;
