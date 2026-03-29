import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWaterIntake extends Document {
  clientId: Types.ObjectId;
  date: Date;
  amount: number;
  createdAt: Date;
}

const WaterIntakeSchema = new Schema<IWaterIntake>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

const WaterIntake: Model<IWaterIntake> =
  mongoose.models.WaterIntake ||
  mongoose.model<IWaterIntake>("WaterIntake", WaterIntakeSchema);

export default WaterIntake;
