import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SHIPPER" | "TRUCKER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "SHIPPER" | "TRUCKER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "SHIPPER" | "TRUCKER";
  }
}
