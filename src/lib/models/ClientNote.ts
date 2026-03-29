import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IClientNote extends Document {
  clientId: Types.ObjectId;
  dietitianId: Types.ObjectId;
  content: string;
  category: "general" | "diet" | "exercise" | "health" | "behavior" | "goal";
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientNoteSchema = new Schema<IClientNote>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    dietitianId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["general", "diet", "exercise", "health", "behavior", "goal"],
      default: "general",
    },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ClientNote: Model<IClientNote> =
  mongoose.models.ClientNote ||
  mongoose.model<IClientNote>("ClientNote", ClientNoteSchema);

export default ClientNote;
