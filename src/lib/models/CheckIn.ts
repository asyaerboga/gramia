import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICheckIn extends Document {
  clientId: Types.ObjectId;
  date: Date;
  mood: 1 | 2 | 3 | 4 | 5; // 1=çok kötü, 5=harika
  energyLevel: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  hungerLevel: 1 | 2 | 3 | 4 | 5;
  symptoms?: string[]; // baş ağrısı, yorgunluk vb.
  notes?: string;
  createdAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    mood: { type: Number, min: 1, max: 5, required: true },
    energyLevel: { type: Number, min: 1, max: 5, required: true },
    stressLevel: { type: Number, min: 1, max: 5, default: 3 },
    hungerLevel: { type: Number, min: 1, max: 5, default: 3 },
    symptoms: [{ type: String }],
    notes: { type: String },
  },
  { timestamps: true },
);

// Unique index: bir gün için tek kayıt
CheckInSchema.index({ clientId: 1, date: 1 }, { unique: true });

const CheckIn: Model<ICheckIn> =
  mongoose.models.CheckIn || mongoose.model<ICheckIn>("CheckIn", CheckInSchema);

export default CheckIn;
