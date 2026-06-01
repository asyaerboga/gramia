import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAvailableSlot extends Document {
  dietitianId: Types.ObjectId;
  date: Date;
  time: string;
  // "extra" = manually added slot outside weekly schedule
  // "blocked" = manually blocked slot that would otherwise exist in the schedule
  type: "extra" | "blocked";
  createdAt: Date;
}

const AvailableSlotSchema = new Schema<IAvailableSlot>(
  {
    dietitianId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    type: { type: String, enum: ["extra", "blocked"], default: "extra" },
  },
  { timestamps: true },
);

AvailableSlotSchema.index({ dietitianId: 1, date: 1, time: 1 }, { unique: true });

const AvailableSlot: Model<IAvailableSlot> =
  mongoose.models.AvailableSlot ||
  mongoose.model<IAvailableSlot>("AvailableSlot", AvailableSlotSchema);

export default AvailableSlot;
