import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IConversation extends Document {
  name: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  lastSeenAt: Map<string, Date>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    name: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastSeenAt: { type: Map, of: Date, default: {} },
  },
  { timestamps: true }
);

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
