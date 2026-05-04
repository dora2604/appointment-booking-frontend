import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type ServiceType = "consultation" | "follow_up" | "therapy" | "dental";

export interface IAppointment extends Document {
  userId: Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  serviceType: ServiceType;
  appointmentDate: Date;
  notes?: string;
  status: AppointmentStatus;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    serviceType: {
      type: String,
      required: true,
      enum: ["consultation", "follow_up", "therapy", "dental"]
    },
    appointmentDate: { type: Date, required: true, index: true },
    notes: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true
    },
    attachmentUrl: { type: String, trim: true }
  },
  { timestamps: true }
);

export const AppointmentModel: Model<IAppointment> = mongoose.model<IAppointment>(
  "Appointment",
  appointmentSchema
);
