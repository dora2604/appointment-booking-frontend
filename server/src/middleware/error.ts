import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: error.message });
  }

  const duplicateKeyError = error as Error & { code?: number; keyPattern?: Record<string, number> };
  if (duplicateKeyError.code === 11000) {
    if (duplicateKeyError.keyPattern?.email) {
      return res.status(409).json({ message: "Email is already registered." });
    }
    return res.status(409).json({ message: "Duplicate record detected." });
  }

  return res.status(500).json({ message: "Internal server error." });
};
