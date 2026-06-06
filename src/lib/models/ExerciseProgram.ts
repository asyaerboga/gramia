import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProgramExercise {
  type: "cardio" | "strength" | "flexibility" | "other";
  name: string;
  duration: number;
  caloriesBurned?: number;
  notes?: string;
}

export interface IDayProgram {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Pazar, 1=Pzt, ..., 6=Cmt
  exercises: IProgramExercise[];
}

export interface IExerciseProgram extends Document {
  clientId: Types.ObjectId;
  name: string;
  days: IDayProgram[];
  completions: string[]; // "YYYY-MM-DD" - tamamlanan günlerin tarihleri
  createdAt: Date;
  updatedAt: Date;
}

const ProgramExerciseSchema = new Schema<IProgramExercise>(
  {
    type: { type: String, enum: ["cardio", "strength", "flexibility", "other"], required: true },
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    caloriesBurned: { type: Number },
    notes: { type: String },
  },
  { _id: false },
);

const DayProgramSchema = new Schema<IDayProgram>(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    exercises: [ProgramExerciseSchema],
  },
  { _id: false },
);

const ExerciseProgramSchema = new Schema<IExerciseProgram>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, unique: true },
    name: { type: String, required: true, default: "Haftalık Programım" },
    days: [DayProgramSchema],
    completions: [{ type: String }],
  },
  { timestamps: true },
);

const ExerciseProgram: Model<IExerciseProgram> =
  mongoose.models.ExerciseProgram ||
  mongoose.model<IExerciseProgram>("ExerciseProgram", ExerciseProgramSchema);

export default ExerciseProgram;
