import { Router } from "express";
import { body } from "express-validator";
import { login, me, register } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

export const authRoutes = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register user
 */
authRoutes.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).escape(),
    body("email").trim().isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["admin", "user"])
  ],
  validateRequest,
  register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 */
authRoutes.post(
  "/login",
  [body("email").trim().isEmail().normalizeEmail(), body("password").isLength({ min: 6 })],
  validateRequest,
  login
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Current user profile
 */
authRoutes.get("/me", authenticate, me);
