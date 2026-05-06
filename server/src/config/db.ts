import { getSupabaseErrorMessage, supabaseStore } from "../repositories/supabaseStore";

export let isSupabaseConnected = false;
let isConnecting = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let lastDatabaseError = "";

const CONNECT_TIMEOUT_MS = 15000;
const MAX_CONNECT_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;
const BACKGROUND_RETRY_MS = 30000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const scheduleReconnect = () => {
  if (reconnectTimer) {
    return;
  }
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (!isSupabaseAvailable()) {
      await connectDb();
    }
  }, BACKGROUND_RETRY_MS);
};

export const isSupabaseAvailable = () => isSupabaseConnected;

export const getDatabaseDiagnostics = () => ({
  connected: isSupabaseAvailable(),
  readyState: isSupabaseAvailable() ? 1 : 0,
  lastError: lastDatabaseError
});

export const connectDb = async () => {
  if (isConnecting || isSupabaseAvailable()) {
    return;
  }

  isConnecting = true;

  try {
    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt += 1) {
      try {
        await Promise.race([
          supabaseStore.ping(),
          wait(CONNECT_TIMEOUT_MS).then(() => {
            throw new Error("Supabase health check timed out.");
          })
        ]);
        isSupabaseConnected = true;
        lastDatabaseError = "";
        // eslint-disable-next-line no-console
        console.log("Supabase connected.");
        return;
      } catch (error) {
        isSupabaseConnected = false;
        lastDatabaseError = getSupabaseErrorMessage(error);
        // eslint-disable-next-line no-console
        console.warn(`Supabase connection attempt ${attempt}/${MAX_CONNECT_ATTEMPTS} failed.`);
        // eslint-disable-next-line no-console
        console.warn(lastDatabaseError);

        if (attempt < MAX_CONNECT_ATTEMPTS) {
          await wait(RETRY_DELAY_MS);
        }
      }
    }

    // eslint-disable-next-line no-console
    console.warn("Supabase unavailable after retries. API will run without database connectivity.");
    scheduleReconnect();
  } finally {
    isConnecting = false;
  }
};
