import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "dietitian" | "client";
    } & DefaultSession["user"];
  }

  interface User {
    role: "dietitian" | "client";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "dietitian" | "client";
  }
}
