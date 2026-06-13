import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReaction {
  emoji: string;
  userId: string;
}

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  type: "text" | "image" | "audio" | "document";
  content: string;
  filename?: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  editedAt?: Date;
  isDeleted?: boolean;
  reactions: IReaction[];
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: false },
    type: {
      type: String,
      enum: ["text", "image", "audio", "document"],
      default: "text",
    },
    content: { type: String, required: true },
    filename: { type: String },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    reactions: [{
      emoji: { type: String, required: true },
      userId: { type: String, required: true },
    }],
  },
  { timestamps: true }
);

const Message: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
