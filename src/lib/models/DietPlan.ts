import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Günlük beslenme planı detayları
interface IMealPlanItem {
  name: string;
  portion: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface IDayPlan {
  breakfast: IMealPlanItem[];
  lunch: IMealPlanItem[];
  dinner: IMealPlanItem[];
  snacks: IMealPlanItem[];
}

export interface IDietPlan extends Document {
  clientId: Types.ObjectId;
  dietitianId: Types.ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  targetCalories: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  weeklyPlan: {
    monday: IDayPlan;
    tuesday: IDayPlan;
    wednesday: IDayPlan;
    thursday: IDayPlan;
    friday: IDayPlan;
    saturday: IDayPlan;
    sunday: IDayPlan;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanItemSchema = new Schema(
  {
    name: { type: String, required: true },
    portion: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number },
    carbs: { type: Number },
    fat: { type: Number },
  },
  { _id: false },
);

const DayPlanSchema = new Schema(
  {
    breakfast: [MealPlanItemSchema],
    lunch: [MealPlanItemSchema],
    dinner: [MealPlanItemSchema],
    snacks: [MealPlanItemSchema],
  },
  { _id: false },
);

const DietPlanSchema = new Schema<IDietPlan>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    dietitianId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    targetCalories: { type: Number, required: true },
    targetProtein: { type: Number },
    targetCarbs: { type: Number },
    targetFat: { type: Number },
    weeklyPlan: {
      monday: DayPlanSchema,
      tuesday: DayPlanSchema,
      wednesday: DayPlanSchema,
      thursday: DayPlanSchema,
      friday: DayPlanSchema,
      saturday: DayPlanSchema,
      sunday: DayPlanSchema,
    },
    notes: { type: String },
  },
  { timestamps: true },
);

const DietPlan: Model<IDietPlan> =
  mongoose.models.DietPlan ||
  mongoose.model<IDietPlan>("DietPlan", DietPlanSchema);

export default DietPlan;
