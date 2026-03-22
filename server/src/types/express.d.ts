declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string | null;
        tier: "free" | "pro";
        displayName?: string | null;
        photoURL?: string | null;
      };
    }
  }
}

export {};

