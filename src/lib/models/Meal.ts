import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMealItem {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion?: string;
}

export interface IMeal extends Document {
  clientId: Types.ObjectId;
  date: Date;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  items: IMealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
  createdAt: Date;
}

const MealSchema = new Schema<IMeal>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        calories: { type: Number, required: true },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        portion: { type: String },
      },
    ],
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

MealSchema.pre("save", function () {
  this.totalCalories = this.items.reduce((sum, item) => sum + item.calories, 0);
  this.totalProtein = this.items.reduce(
    (sum, item) => sum + (item.protein || 0),
    0,
  );
  this.totalCarbs = this.items.reduce(
    (sum, item) => sum + (item.carbs || 0),
    0,
  );
  this.totalFat = this.items.reduce((sum, item) => sum + (item.fat || 0), 0);
});

const Meal: Model<IMeal> =
  mongoose.models.Meal || mongoose.model<IMeal>("Meal", MealSchema);

export default Meal;
