import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISleep extends Document {
  clientId: Types.ObjectId;
  date: Date;
  bedTime: string; // "23:00" format
  wakeTime: string; // "07:00" format
  duration: number; // saat cinsinden
  quality: 1 | 2 | 3 | 4 | 5; // 1-5 arası kalite
  notes?: string;
  createdAt: Date;
}

const SleepSchema = new Schema<ISleep>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    bedTime: { type: String, required: true },
    wakeTime: { type: String, required: true },
    duration: { type: Number, required: true },
    quality: { type: Number, min: 1, max: 5, required: true },
    notes: { type: String },
  },
  { timestamps: true },
);

// Unique index: bir gün için tek kayıt
SleepSchema.index({ clientId: 1, date: 1 }, { unique: true });

const Sleep: Model<ISleep> =
  mongoose.models.Sleep || mongoose.model<ISleep>("Sleep", SleepSchema);

export default Sleep;
