import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDaySchedule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 1=Mon, ..., 6=Sat
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface IWeeklySchedule extends Document {
  dietitianId: Types.ObjectId;
  days: IDaySchedule[];
  slotDuration: number;       // minutes (15 | 30 | 45 | 60)
  excludePublicHolidays: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DayScheduleSchema = new Schema<IDaySchedule>(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "17:00" },
  },
  { _id: false },
);

const WeeklyScheduleSchema = new Schema<IWeeklySchedule>(
  {
    dietitianId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    days: [DayScheduleSchema],
    slotDuration: { type: Number, enum: [15, 30, 45, 60], default: 30 },
    excludePublicHolidays: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const WeeklySchedule: Model<IWeeklySchedule> =
  mongoose.models.WeeklySchedule ||
  mongoose.model<IWeeklySchedule>("WeeklySchedule", WeeklyScheduleSchema);

export default WeeklySchedule;
