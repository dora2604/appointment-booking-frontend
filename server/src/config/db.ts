import mongoose from "mongoose";
import { env } from "./env";

export let isMongoConnected = false;

export const connectDb = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    isMongoConnected = true;
    // eslint-disable-next-line no-console
    console.log("MongoDB connected.");
  } catch (error) {
    isMongoConnected = false;
    // eslint-disable-next-line no-console
    console.warn("MongoDB unavailable. Using local JSON file storage.");
    // eslint-disable-next-line no-console
    console.warn(error);
  }
};
