declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      role: "admin" | "user";
      name: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
