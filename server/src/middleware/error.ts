import { NextFunction, Request, Response } from "express";
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

  const duplicateKeyError = error as Error & { code?: string; details?: string; message?: string };
  if (duplicateKeyError.code === "23505") {
    if (duplicateKeyError.details?.includes("email") || duplicateKeyError.message?.includes("email")) {
      return res.status(409).json({ message: "Email is already registered." });
    }
    return res.status(409).json({ message: "Duplicate record detected." });
  }

  return res.status(500).json({ message: "Internal server error." });
};
