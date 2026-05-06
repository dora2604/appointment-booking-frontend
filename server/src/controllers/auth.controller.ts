import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { isSupabaseAvailable } from "../config/db";
import { fileStore } from "../repositories/fileStore";
import { supabaseStore } from "../repositories/supabaseStore";
import { UserRole } from "../types/data";

const signToken = (user: { _id: string; email: string; role: UserRole; name: string }) => {
  const expiresIn = env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    env.JWT_SECRET,
    { expiresIn }
  );
};

const ensureDemoStorageEnabled = () => {
  if (!env.ALLOW_DEMO_STORAGE) {
    throw new ApiError(503, "Database is unavailable. Please try again later.");
  }
};

const withTimeout = async <T>(operation: Promise<T>, label: string, timeoutMs = 8000) => {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`${label} timed out.`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

const registerWithFileStore = async (
  name: string,
  email: string,
  password: string,
  role?: UserRole
) => {
  const existing = fileStore.findUserByEmail(email);
  if (existing) {
    throw new ApiError(409, "Email is already registered.");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = fileStore.createUser({
    name,
    email,
    password: hashed,
    role: role ?? "user"
  });
  const token = signToken({
    _id: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  return {
    message: "Registration successful.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

const loginWithFileStore = async (email: string, password: string) => {
  const user = fileStore.findUserByEmail(email);
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken({
    _id: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  return {
    message: "Login successful.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: "admin" | "user";
  };

  if (!isSupabaseAvailable()) {
    ensureDemoStorageEnabled();
    return res.status(201).json(await registerWithFileStore(name, email, password, role));
  }

  try {
    const existing = await withTimeout(supabaseStore.findUserByEmail(email), "Find user");
    if (existing) {
      throw new ApiError(409, "Email is already registered.");
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await withTimeout(
      supabaseStore.createUser({
        name,
        email,
        password: hashed,
        role: role ?? "user"
      }),
      "Create user"
    );

    const token = signToken({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    ensureDemoStorageEnabled();
    // eslint-disable-next-line no-console
    console.warn("Supabase auth register unavailable. Falling back to local JSON storage.", error);
    return res.status(201).json(await registerWithFileStore(name, email, password, role));
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!isSupabaseAvailable()) {
    ensureDemoStorageEnabled();
    return res.status(200).json(await loginWithFileStore(email, password));
  }

  try {
    const user = await withTimeout(supabaseStore.findUserByEmail(email), "Find user");
    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const token = signToken({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    ensureDemoStorageEnabled();
    // eslint-disable-next-line no-console
    console.warn("Supabase auth login unavailable. Falling back to local JSON storage.", error);
    return res.status(200).json(await loginWithFileStore(email, password));
  }
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }
  res.status(200).json({ user: req.user });
});
