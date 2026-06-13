import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AppointmentNotificationType =
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_cancelled_by_client"
  | "appointment_completed"
  | "appointment_time_changed"
  | "appointment_deleted"
  | "appointment_status_changed";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: AppointmentNotificationType;
  title: string;
  message: string;
  isRead: boolean;
  appointmentId?: Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
  },
  { timestamps: true }
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
