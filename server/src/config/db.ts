import mongoose from "mongoose";
import { env } from "./env";

export let isMongoConnected = false;

mongoose.set("bufferCommands", false);

mongoose.connection.on("connected", () => {
  isMongoConnected = true;
});

mongoose.connection.on("disconnected", () => {
  isMongoConnected = false;
});

mongoose.connection.on("error", () => {
  isMongoConnected = false;
});

export const isMongoAvailable = () => isMongoConnected && mongoose.connection.readyState === 1;

export const connectDb = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
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
