import { app } from "../app";
import { connectDb } from "../config/db";

let dbConnected = false;

const ensureDbConnected = async () => {
  if (!dbConnected) {
    await connectDb();
    dbConnected = true;
  }
};

export default async function handler(req: any, res: any) {
  await ensureDbConnected();
  return app(req, res);
}
