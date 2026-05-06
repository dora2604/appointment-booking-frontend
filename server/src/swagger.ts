import { Express } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";

const serverUrl = env.PORT === 5000 ? "http://localhost:5000" : `http://localhost:${env.PORT}`;

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Appointment Booking API",
      version: "1.0.0",
      description: "REST API for Appointment Booking System"
    },
    servers: [
      { url: serverUrl, description: "Current server" },
      { url: "http://localhost:5000", description: "Local development" }
    ],
    tags: [
      { name: "Health", description: "API health and service status" },
      { name: "Auth", description: "Authentication and current user profile" },
      { name: "Appointments", description: "Appointment creation and management" },
      { name: "Uploads", description: "Attachment uploads" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Invalid email or password." }
          }
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "6811c683cf544cc99e147ad4" },
            name: { type: "string", example: "Jane Doe" },
            email: { type: "string", example: "jane@example.com" },
            role: { type: "string", enum: ["admin", "user"], example: "user" }
          }
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful." },
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            user: { $ref: "#/components/schemas/User" }
          }
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Jane Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: { type: "string", format: "password", example: "password123" },
            role: { type: "string", enum: ["admin", "user"], example: "user" }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: { type: "string", format: "password", example: "password123" }
          }
        },
        Appointment: {
          type: "object",
          properties: {
            _id: { type: "string", example: "6811c683cf544cc99e147ad4" },
            userId: { type: "string", example: "6811c683cf544cc99e147ad1" },
            fullName: { type: "string", example: "Jane Doe" },
            email: { type: "string", example: "jane@example.com" },
            phone: { type: "string", example: "09123456789" },
            serviceType: {
              type: "string",
              enum: ["consultation", "follow_up", "therapy", "dental"],
              example: "consultation"
            },
            appointmentDate: { type: "string", format: "date-time", example: "2026-05-10T08:30:00.000Z" },
            notes: { type: "string", example: "Bring previous records." },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "completed"],
              example: "pending"
            },
            attachmentUrl: { type: "string", example: "/uploads/report.pdf" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        AppointmentInput: {
          type: "object",
          required: ["fullName", "email", "phone", "serviceType", "appointmentDate"],
          properties: {
            fullName: { type: "string", example: "Jane Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            phone: { type: "string", example: "09123456789" },
            serviceType: {
              type: "string",
              enum: ["consultation", "follow_up", "therapy", "dental"],
              example: "consultation"
            },
            appointmentDate: { type: "string", format: "date-time", example: "2026-05-10T08:30:00.000Z" },
            notes: { type: "string", example: "Bring previous records." },
            attachmentUrl: { type: "string", example: "/uploads/report.pdf" }
          }
        },
        AppointmentUpdate: {
          type: "object",
          properties: {
            fullName: { type: "string", example: "Jane Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            phone: { type: "string", example: "09123456789" },
            serviceType: {
              type: "string",
              enum: ["consultation", "follow_up", "therapy", "dental"],
              example: "therapy"
            },
            appointmentDate: { type: "string", format: "date-time", example: "2026-05-10T09:00:00.000Z" },
            notes: { type: "string", example: "Updated notes." },
            attachmentUrl: { type: "string", example: "/uploads/updated-report.pdf" },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "completed"],
              example: "confirmed"
            }
          }
        },
        AppointmentListResponse: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/Appointment" }
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 8 },
                total: { type: "integer", example: 24 },
                totalPages: { type: "integer", example: 3 }
              }
            }
          }
        },
        AppointmentResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Appointment booked successfully." },
            appointment: { $ref: "#/components/schemas/Appointment" }
          }
        },
        UploadResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "File uploaded successfully." },
            file: {
              type: "object",
              properties: {
                filename: { type: "string", example: "report-123456.pdf" },
                mimetype: { type: "string", example: "application/pdf" },
                size: { type: "integer", example: 34892 },
                url: { type: "string", example: "/uploads/report-123456.pdf" }
              }
            }
          }
        },
        SummaryResponse: {
          type: "object",
          properties: {
            total: { type: "integer", example: 24 },
            pending: { type: "integer", example: 6 },
            confirmed: { type: "integer", example: 10 },
            cancelled: { type: "integer", example: 3 },
            completed: { type: "integer", example: 5 }
          }
        },
        HealthResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: true },
            message: { type: "string", example: "Appointment API is healthy." },
            storage: { type: "string", example: "mongodb" }
          }
        }
      }
    }
  },
  apis: ["src/routes/*.ts", "src/app.ts"]
};

export const setupSwagger = (app: Express) => {
  const specs = swaggerJsDoc(options);
  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));
};
