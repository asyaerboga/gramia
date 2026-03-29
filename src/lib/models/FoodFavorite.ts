import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFoodFavorite extends Document {
  clientId: Types.ObjectId;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion?: string;
  category?: string;
  usageCount: number;
  createdAt: Date;
}

const FoodFavoriteSchema = new Schema<IFoodFavorite>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number },
    carbs: { type: Number },
    fat: { type: Number },
    portion: { type: String },
    category: { type: String },
    usageCount: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// Unique: her yiyecek danışan başına tek kayıt
FoodFavoriteSchema.index({ clientId: 1, name: 1 }, { unique: true });

const FoodFavorite: Model<IFoodFavorite> =
  mongoose.models.FoodFavorite ||
  mongoose.model<IFoodFavorite>("FoodFavorite", FoodFavoriteSchema);

export default FoodFavorite;
