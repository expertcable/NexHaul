import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface MockSession {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: "SHIPPER" | "TRUCKER" | string;
  };
}

/**
 * Session helper that intercepts requests or URL parameters over LocalTunnel or demo sessions.
 * Prevents login loops when third-party tunneling proxies break NextAuth JWT cookies.
 */
export async function getMockOrRealSession(
  paramsOrRequest?: { mock_role?: string; demoRole?: string } | Request | null
): Promise<MockSession | null> {
  let roleParam: string | null | undefined;

  if (paramsOrRequest instanceof Request) {
    const { searchParams } = new URL(paramsOrRequest.url);
    roleParam =
      searchParams.get("mock_role") ||
      searchParams.get("demoRole") ||
      paramsOrRequest.headers.get("x-mock-role");
  } else if (paramsOrRequest && ("mock_role" in paramsOrRequest || "demoRole" in paramsOrRequest)) {
    roleParam = paramsOrRequest.mock_role || paramsOrRequest.demoRole;
  }

  const normalizedRole = roleParam?.toUpperCase();

  if (normalizedRole === "TRUCKER" || normalizedRole === "SHIPPER") {
    const role = normalizedRole as "TRUCKER" | "SHIPPER";
    const userId = role === "TRUCKER" ? "demo-trucker-id" : "demo-shipper-id";
    const email = role === "TRUCKER" ? "trucker@demo.com" : "shipper@demo.com";
    const name = role === "TRUCKER" ? "Demo Trucker (LocalTunnel)" : "Demo Shipper (LocalTunnel)";

    try {
      // Synchronize dummy account in PostgreSQL so foreign keys on Load and Journey tables do not break
      await prisma.user.upsert({
        where: { id: userId },
        update: { role, email, name },
        create: {
          id: userId,
          email,
          name,
          role,
          passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz0123456789a", // Dummy hash for mock bypass accounts
        },
      });
    } catch (e) {
      console.warn("Warning: could not synchronize bypass account in database:", e);
    }

    return {
      user: {
        id: userId,
        name,
        email,
        role,
      },
    };
  }

  // Fall back to standard NextAuth session
  return await auth();
}
