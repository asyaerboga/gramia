import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IExercise extends Document {
  clientId: Types.ObjectId;
  date: Date;
  type: "cardio" | "strength" | "flexibility" | "other";
  name: string;
  duration: number; // dakika
  caloriesBurned?: number;
  intensity: "low" | "medium" | "high";
  notes?: string;
  createdAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["cardio", "strength", "flexibility", "other"],
      required: true,
    },
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    caloriesBurned: { type: Number },
    intensity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    notes: { type: String },
  },
  { timestamps: true },
);

const Exercise: Model<IExercise> =
  mongoose.models.Exercise ||
  mongoose.model<IExercise>("Exercise", ExerciseSchema);

export default Exercise;
