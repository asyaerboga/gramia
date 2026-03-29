import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMeasurement extends Document {
  clientId: Types.ObjectId;
  date: Date;
  regions: {
    neck: number;
    chest: number;
    waist: number;
    hip: number;
    arm: number;
    thigh: number;
    calf: number;
  };
  createdAt: Date;
}

const MeasurementSchema = new Schema<IMeasurement>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    regions: {
      neck: { type: Number, default: 0 },
      chest: { type: Number, default: 0 },
      waist: { type: Number, default: 0 },
      hip: { type: Number, default: 0 },
      arm: { type: Number, default: 0 },
      thigh: { type: Number, default: 0 },
      calf: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Measurement: Model<IMeasurement> =
  mongoose.models.Measurement ||
  mongoose.model<IMeasurement>("Measurement", MeasurementSchema);

export default Measurement;
