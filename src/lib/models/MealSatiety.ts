import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMealSatiety extends Document {
  clientId: Types.ObjectId;
  date: Date;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  satietyLevel: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MealSatietySchema = new Schema<IMealSatiety>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    satietyLevel: { type: Number, min: 1, max: 5, required: true },
    notes: { type: String },
  },
  { timestamps: true },
);

// One record per client per meal type per day
MealSatietySchema.index({ clientId: 1, date: 1, mealType: 1 }, { unique: true });

const MealSatiety: Model<IMealSatiety> =
  mongoose.models.MealSatiety ||
  mongoose.model<IMealSatiety>("MealSatiety", MealSatietySchema);

export default MealSatiety;
