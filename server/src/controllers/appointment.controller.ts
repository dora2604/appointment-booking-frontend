import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import { AppointmentModel, IAppointment } from "../models/Appointment";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { isMongoAvailable } from "../config/db";
import { env } from "../config/env";
import { fileStore, StoredAppointment } from "../repositories/fileStore";

const ensureDemoStorageEnabled = () => {
  if (!env.ALLOW_DEMO_STORAGE) {
    throw new ApiError(503, "Database is unavailable. Please try again later.");
  }
};

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  const payload = req.body as Partial<IAppointment>;

  if (!isMongoAvailable()) {
    ensureDemoStorageEnabled();
    const created = fileStore.createAppointment({
      ...(payload as Partial<StoredAppointment>),
      userId: req.user.id,
      status: "pending"
    } as StoredAppointment);

    return res.status(201).json({
      message: "Appointment booked successfully.",
      appointment: created
    });
  }

  const created = await AppointmentModel.create({
    ...payload,
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

  if (!isMongoAvailable()) {
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

  const query: FilterQuery<IAppointment> = {};

  if (req.user.role !== "admin") {
    query.userId = req.user.id;
  }
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } }
    ];
  }
  if (status) {
    query.status = status as IAppointment["status"];
  }
  if (serviceType) {
    query.serviceType = serviceType as IAppointment["serviceType"];
  }
  if (appointmentDate) {
    const selected = new Date(appointmentDate);
    const nextMinute = new Date(selected.getTime() + 60000);
    query.appointmentDate = {
      $gte: selected,
      $lt: nextMinute
    };
  }

  const [items, total] = await Promise.all([
    AppointmentModel.find(query).sort({ [sortBy]: order }).skip(skip).limit(limit),
    AppointmentModel.countDocuments(query)
  ]);

  res.status(200).json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  if (!isMongoAvailable()) {
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

  const appointment = await AppointmentModel.findById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found.");
  }
  if (req.user.role !== "admin" && String(appointment.userId) !== String(req.user.id)) {
    throw new ApiError(403, "Forbidden.");
  }
  res.status(200).json({ appointment });
});

export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  if (!isMongoAvailable()) {
    ensureDemoStorageEnabled();
    const appointment = fileStore.findAppointmentById(req.params.id);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found.");
    }

    if (req.user.role !== "admin" && appointment.userId !== req.user.id) {
      throw new ApiError(403, "Forbidden.");
    }

    const payload = req.body as Partial<StoredAppointment>;
    if (req.user.role !== "admin") {
      delete payload.status;
    }

    const updated = fileStore.updateAppointment(req.params.id, payload);
    return res.status(200).json({
      message: "Appointment updated successfully.",
      appointment: updated
    });
  }

  const appointment = await AppointmentModel.findById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found.");
  }

  if (req.user.role !== "admin" && String(appointment.userId) !== String(req.user.id)) {
    throw new ApiError(403, "Forbidden.");
  }

  const payload = req.body as Partial<IAppointment>;
  const isAdmin = req.user.role === "admin";

  if (!isAdmin) {
    delete payload.status;
  }

  Object.assign(appointment, payload);
  await appointment.save();

  res.status(200).json({
    message: "Appointment updated successfully.",
    appointment
  });
});

export const deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }

  if (!isMongoAvailable()) {
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

  const appointment = await AppointmentModel.findById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found.");
  }

  if (req.user.role !== "admin" && String(appointment.userId) !== String(req.user.id)) {
    throw new ApiError(403, "Forbidden.");
  }

  await appointment.deleteOne();
  res.status(200).json({ message: "Appointment deleted successfully." });
});

export const adminSummary = asyncHandler(async (_req: Request, res: Response) => {
  if (!isMongoAvailable()) {
    ensureDemoStorageEnabled();
    return res.status(200).json(fileStore.appointmentSummary());
  }

  const [total, pending, confirmed, cancelled, completed] = await Promise.all([
    AppointmentModel.countDocuments({}),
    AppointmentModel.countDocuments({ status: "pending" }),
    AppointmentModel.countDocuments({ status: "confirmed" }),
    AppointmentModel.countDocuments({ status: "cancelled" }),
    AppointmentModel.countDocuments({ status: "completed" })
  ]);

  res.status(200).json({
    total,
    pending,
    confirmed,
    cancelled,
    completed
  });
});
