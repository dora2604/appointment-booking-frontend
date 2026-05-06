export type UserRole = "admin" | "user";
export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type ServiceType = "consultation" | "follow_up" | "therapy" | "dental";

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRecord {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  serviceType: ServiceType;
  appointmentDate: string;
  notes?: string;
  status: AppointmentStatus;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListOptions {
  userId?: string;
  search?: string;
  status?: string;
  serviceType?: string;
  appointmentDate?: string;
  page: number;
  limit: number;
  sortBy: string;
  order: 1 | -1;
}
