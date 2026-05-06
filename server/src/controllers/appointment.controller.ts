import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { isSupabaseAvailable } from "../config/db";
import { env } from "../config/env";
import { fileStore } from "../repositories/fileStore";
import { supabaseStore } from "../repositories/supabaseStore";
import { AppointmentRecord } from "../types/data";

const ensureDemoStorageEnabled = () => {
  if (!env.ALLOW_DEMO_STORAGE) {
    throw new ApiError(503, "Database is unavailable. Please try again later.");
  }
};

const pickAppointmentPayload = (
  payload: Partial<AppointmentRecord>,
  options?: { allowStatus?: boolean }
) => {
  const nextPayload: Record<string, unknown> = {};

  if (payload.fullName !== undefined) nextPayload.fullName = payload.fullName;
  if (payload.email !== undefined) nextPayload.email = payload.email;
  if (payload.phone !== undefined) nextPayload.phone = payload.phone;
  if (payload.serviceType !== undefined) nextPayload.serviceType = payload.serviceType;
  if (payload.appointmentDate !== undefined) nextPayload.appointmentDate = payload.appointmentDate;
  if (payload.notes !== undefined) nextPayload.notes = payload.notes;
  if (payload.attachmentUrl !== undefined) nextPayload.attachmentUrl = payload.attachmentUrl;
  if (options?.allowStatus && payload.status !== undefined) nextPayload.status = payload.status;

  return nextPayload;
};

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  const payload = pickAppointmentPayload(req.body as Partial<AppointmentRecord>);

  if (!isSupabaseAvailable()) {
    ensureDemoStorageEnabled();
    const created = fileStore.createAppointment({
      ...(payload as Partial<AppointmentRecord>),
      userId: req.user.id,
      status: "pending"
    } as Omit<AppointmentRecord, "_id" | "createdAt" | "updatedAt">);

    return res.status(201).json({
      message: "Appointment booked successfully.",
      appointment: created
    });
  }

  const created = await supabaseStore.createAppointment({
    ...(payload as Omit<AppointmentRecord, "_id" | "createdAt" | "updatedAt">),
    userId: req.user.id,
    status: "pending"
  });

  res.status(201).json({
    message: "Appointment booked successfully.",
    appointment: created
  });
});

export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 10), 50);
  const skip = (page - 1) * limit;
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  const serviceType = String(req.query.serviceType ?? "").trim();
  const appointmentDate = String(req.query.appointmentDate ?? "").trim();
  const sortBy = String(req.query.sortBy ?? "appointmentDate");
  const order = String(req.query.order ?? "asc") === "desc" ? -1 : 1;

  if (!isSupabaseAvailable()) {
    ensureDemoStorageEnabled();
    const result = fileStore.listAppointments({
      userId: req.user.role === "admin" ? undefined : req.user.id,
      search,
      status,
      serviceType,
      appointmentDate,
      page,
      limit,
      sortBy,
      order
    });

    return res.status(200).json({
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  }

  const result = await supabaseStore.listAppointments({
    userId: req.user.role === "admin" ? undefined : req.user.id,
    search,
    status,
    serviceType,
    appointmentDate,
    page,
    limit,
    sortBy,
    order
  });

  res.status(200).json({
    items: result.items,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }
  });
});

export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  if (!isSupabaseAvailable()) {
    ensureDemoStorageEnabled();
    const appointment = fileStore.findAppointmentById(req.params.id);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found.");
    }
    if (req.user.role !== "admin" && appointment.userId !== req.user.id) {
      throw new ApiError(403, "Forbidden.");
    }
    return res.status(200).json({ appointment });
  }

  const appointment = await supabaseStore.findAppointmentById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found.");
  }
  if (req.user.role !== "admin" && appointment.userId !== req.user.id) {
    throw new ApiError(403, "Forbidden.");
  }
  res.status(200).json({ appointment });
});

export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  if (!isSupabaseAvailable()) {
    ensureDemoStorageEnabled();
    const appointment = fileStore.findAppointmentById(req.params.id);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found.");
    }

    if (req.user.role !== "admin" && appointment.userId !== req.user.id) {
      throw new ApiError(403, "Forbidden.");
    }

    const payload = pickAppointmentPayload(req.body as Partial<AppointmentRecord>, {
      allowStatus: req.user.role === "admin"
    }) as Partial<AppointmentRecord>;

    const updated = fileStore.updateAppointment(req.params.id, payload);
    return res.status(200).json({
      message: "Appointment updated successfully.",
      appointment: updated
    });
  }

  const appointment = await supabaseStore.findAppointmentById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found.");
  }

  if (req.user.role !== "admin" && appointment.userId !== req.user.id) {
    throw new ApiError(403, "Forbidden.");
  }

  const payload = pickAppointmentPayload(req.body as Partial<AppointmentRecord>, {
    allowStatus: req.user.role === "admin"
  });

  const updated = await supabaseStore.updateAppointment(req.params.id, payload);

  res.status(200).json({
    message: "Appointment updated successfully.",
    appointment: updated
  });
});

export const deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  if (!isSupabaseAvailable()) {
    ensureDemoStorageEnabled();
    const appointment = fileStore.findAppointmentById(req.params.id);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found.");
    }

    if (req.user.role !== "admin" && appointment.userId !== req.user.id) {
      throw new ApiError(403, "Forbidden.");
    }

    fileStore.deleteAppointment(req.params.id);
    return res.status(200).json({ message: "Appointment deleted successfully." });
  }

  const appointment = await supabaseStore.findAppointmentById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found.");
  }

  if (req.user.role !== "admin" && appointment.userId !== req.user.id) {
    throw new ApiError(403, "Forbidden.");
  }

  await supabaseStore.deleteAppointment(req.params.id);
  res.status(200).json({ message: "Appointment deleted successfully." });
});

export const adminSummary = asyncHandler(async (_req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    ensureDemoStorageEnabled();
    return res.status(200).json(fileStore.appointmentSummary());
  }

  res.status(200).json(await supabaseStore.appointmentSummary());
});
