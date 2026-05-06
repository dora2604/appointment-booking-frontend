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
 *     tags: [Appointments]
 *     summary: Create an appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentInput'
 *     responses:
 *       201:
 *         description: Appointment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 */
appointmentRoutes.post("/", appointmentValidation, validateRequest, createAppointment);

/**
 * @openapi
 * /api/appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: Get appointments with search/filter/pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [consultation, follow_up, therapy, dental]
 *       - in: query
 *         name: appointmentDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated appointments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentListResponse'
 */
appointmentRoutes.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("status").optional().isIn(["pending", "confirmed", "cancelled", "completed"]),
    query("serviceType").optional().isIn(["consultation", "follow_up", "therapy", "dental"]),
    query("appointmentDate").optional().isISO8601(),
    query("search").optional().trim().escape()
  ],
  validateRequest,
  getAppointments
);

/**
 * @openapi
 * /api/appointments/admin/summary:
 *   get:
 *     tags: [Appointments]
 *     summary: Admin dashboard metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SummaryResponse'
 */
appointmentRoutes.get("/admin/summary", authorize("admin"), adminSummary);

/**
 * @openapi
 * /api/appointments/{id}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get single appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 */
appointmentRoutes.get("/:id", [param("id").isMongoId()], validateRequest, getAppointmentById);

/**
 * @openapi
 * /api/appointments/{id}:
 *   put:
 *     tags: [Appointments]
 *     summary: Update appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentUpdate'
 *     responses:
 *       200:
 *         description: Appointment updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
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
 *     tags: [Appointments]
 *     summary: Delete appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
appointmentRoutes.delete("/:id", [param("id").isMongoId()], validateRequest, deleteAppointment);
