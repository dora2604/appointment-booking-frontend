import mongoose from "mongoose";
import { env } from "./env";

export let isMongoConnected = false;
let isConnecting = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let lastMongoError = "";

mongoose.set("bufferCommands", false);

mongoose.connection.on("connected", () => {
  isMongoConnected = true;
  lastMongoError = "";
});

mongoose.connection.on("disconnected", () => {
  isMongoConnected = false;
});

mongoose.connection.on("error", () => {
  isMongoConnected = false;
});

export const isMongoAvailable = () => isMongoConnected && mongoose.connection.readyState === 1;

const CONNECT_TIMEOUT_MS = 15000;
const MAX_CONNECT_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;
const BACKGROUND_RETRY_MS = 30000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const redactMongoUri = (value: string) => value.replace(/\/\/([^:]+):([^@]+)@/, "//$1:<redacted>@");

const normalizeMongoUri = (value: string) => {
  const trimmed = value.trim();
  const schemeMatch = trimmed.match(/^(mongodb(?:\+srv)?):\/\//i);
  if (!schemeMatch) {
    return trimmed;
  }

  const scheme = schemeMatch[0];
  const remainder = trimmed.slice(scheme.length);
  const slashIndex = remainder.indexOf("/");
  const authority = slashIndex >= 0 ? remainder.slice(0, slashIndex) : remainder;
  const pathAndQuery = slashIndex >= 0 ? remainder.slice(slashIndex) : "";
  const atIndex = authority.lastIndexOf("@");

  if (atIndex < 0) {
    return trimmed;
  }

  const credentials = authority.slice(0, atIndex);
  const hosts = authority.slice(atIndex + 1);
  const colonIndex = credentials.indexOf(":");

  if (colonIndex < 0) {
    return trimmed;
  }

  const username = credentials.slice(0, colonIndex);
  const password = credentials.slice(colonIndex + 1);

  return `${scheme}${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hosts}${pathAndQuery}`;
};

const scheduleReconnect = () => {
  if (reconnectTimer) {
    return;
  }
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (!isMongoAvailable()) {
      await connectDb();
    }
  }, BACKGROUND_RETRY_MS);
};

export const getMongoDiagnostics = () => ({
  connected: isMongoAvailable(),
  readyState: mongoose.connection.readyState,
  lastError: lastMongoError
});

export const connectDb = async () => {
  if (isConnecting || isMongoAvailable()) {
    return;
  }

  isConnecting = true;
  const mongoUri = normalizeMongoUri(env.MONGO_URI);

  try {
    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt += 1) {
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
          socketTimeoutMS: CONNECT_TIMEOUT_MS
        });
        isMongoConnected = true;
        lastMongoError = "";
        // eslint-disable-next-line no-console
        console.log("MongoDB connected.");
        return;
      } catch (error) {
        isMongoConnected = false;
        lastMongoError = error instanceof Error ? error.message : "Unknown MongoDB error.";
        // eslint-disable-next-line no-console
        console.warn(
          `MongoDB connection attempt ${attempt}/${MAX_CONNECT_ATTEMPTS} failed for ${redactMongoUri(mongoUri)}`
        );
        // eslint-disable-next-line no-console
        console.warn(lastMongoError);

        if (attempt < MAX_CONNECT_ATTEMPTS) {
          await wait(RETRY_DELAY_MS);
        }
      }
    }

    // eslint-disable-next-line no-console
    console.warn("MongoDB unavailable after retries. API will run without database connectivity.");
    scheduleReconnect();
  } finally {
    isConnecting = false;
  }
};
