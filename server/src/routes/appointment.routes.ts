import { Router } from "express";
import { body, param, query } from "express-validator";

import {
  adminSummary,
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  getAppointments,
  updateAppointment
} from "../controllers/appointment.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";

export const appointmentRoutes = Router();

appointmentRoutes.use(authenticate);

const appointmentValidation = [
  body("fullName").trim().isLength({ min: 2 }).escape(),
  body("email").trim().isEmail().normalizeEmail(),
  body("phone").trim().isLength({ min: 7, max: 20 }).escape(),
  body("serviceType").isIn(["consultation", "follow_up", "therapy", "dental"]),
  body("appointmentDate").isISO8601(),
  body("notes").optional().trim().isLength({ max: 500 }).escape(),
  body("attachmentUrl").optional().trim().isString().escape()
];

/**
 * @openapi
 * /api/appointments:
 *   post:
 *     summary: Create an appointment
 */
appointmentRoutes.post("/", appointmentValidation, validateRequest, createAppointment);

/**
 * @openapi
 * /api/appointments:
 *   get:
 *     summary: Get appointments with search/filter/pagination
 */
appointmentRoutes.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("status").optional().isIn(["pending", "confirmed", "cancelled", "completed"]),
    query("serviceType").optional().isIn(["consultation", "follow_up", "therapy", "dental"]),
    query("from").optional().isISO8601(),
    query("to").optional().isISO8601(),
    query("search").optional().trim().escape()
  ],
  validateRequest,
  getAppointments
);

/**
 * @openapi
 * /api/appointments/admin/summary:
 *   get:
 *     summary: Admin dashboard metrics
 */
appointmentRoutes.get("/admin/summary", authorize("admin"), adminSummary);

/**
 * @openapi
 * /api/appointments/{id}:
 *   get:
 *     summary: Get single appointment
 */
appointmentRoutes.get("/:id", [param("id").isMongoId()], validateRequest, getAppointmentById);

/**
 * @openapi
 * /api/appointments/{id}:
 *   put:
 *     summary: Update appointment
 */
appointmentRoutes.put(
  "/:id",
  [
    param("id").isMongoId(),
    body("fullName").optional().trim().isLength({ min: 2 }).escape(),
    body("email").optional().trim().isEmail().normalizeEmail(),
    body("phone").optional().trim().isLength({ min: 7, max: 20 }).escape(),
    body("serviceType").optional().isIn(["consultation", "follow_up", "therapy", "dental"]),
    body("appointmentDate").optional().isISO8601(),
    body("status").optional().isIn(["pending", "confirmed", "cancelled", "completed"]),
    body("notes").optional().trim().isLength({ max: 500 }).escape(),
    body("attachmentUrl").optional().trim().isString().escape()
  ],
  validateRequest,
  updateAppointment
);

/**
 * @openapi
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete appointment
 */
appointmentRoutes.delete("/:id", [param("id").isMongoId()], validateRequest, deleteAppointment);
