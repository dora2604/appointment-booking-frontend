import { Router } from "express";

import { uploadFile } from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";

export const uploadRoutes = Router();

/**
 * @openapi
 * /api/uploads:
 *   post:
 *     summary: Upload appointment attachment
 */
uploadRoutes.post("/", authenticate, upload.single("file"), uploadFile);
