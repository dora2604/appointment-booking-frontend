import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import { env } from "./config/env";
import { isMongoConnected } from "./config/db";
import { authRoutes } from "./routes/auth.routes";
import { appointmentRoutes } from "./routes/appointment.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/error";
import { setupSwagger } from "./swagger";

export const app = express();

const normalizeOrigin = (origin: string) => {
  const trimmed = origin.trim();
  if (!trimmed) {
    return "";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const allowedOrigins = new Set(
  env.CLIENT_ORIGIN.split(",").map(normalizeOrigin).filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Appointment API is running.",
    health: "/api/health"
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Appointment API is healthy.",
    storage: isMongoConnected ? "mongodb" : "local-json-demo"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/uploads", uploadRoutes);

setupSwagger(app);

app.use(notFoundHandler);
app.use(errorHandler);
