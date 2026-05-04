export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type ServiceType = "consultation" | "follow_up" | "therapy" | "dental";

export interface Appointment {
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

export interface AppointmentListResponse {
  items: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
