import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBloodTest extends Document {
  clientId: Types.ObjectId;
  dietitianId: Types.ObjectId;
  imageUrl: string;
  originalName: string;
  notes?: string;
  testDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BloodTestSchema = new Schema<IBloodTest>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    dietitianId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    notes: { type: String },
    testDate: { type: Date, required: true },
  },
  { timestamps: true },
);

const BloodTest: Model<IBloodTest> =
  mongoose.models.BloodTest ||
  mongoose.model<IBloodTest>("BloodTest", BloodTestSchema);

export default BloodTest;
