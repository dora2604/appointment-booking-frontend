import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { UserModel } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { isMongoConnected } from "../config/db";
import { fileStore } from "../repositories/fileStore";

const signToken = (user: { _id: string; email: string; role: "admin" | "user"; name: string }) => {
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

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: "admin" | "user";
  };

  if (!isMongoConnected) {
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
  }

  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email is already registered.");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    name,
    email,
    password: hashed,
    role: role ?? "user"
  });

  const token = signToken({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name
  });

  res.status(201).json({
    message: "Registration successful.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!isMongoConnected) {
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
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name
  });

  res.status(200).json({
    message: "Login successful.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized.");
  }
  res.status(200).json({ user: req.user });
});
