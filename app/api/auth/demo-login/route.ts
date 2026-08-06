import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roleParam = searchParams.get("role")?.toUpperCase();
  const role = roleParam === "TRUCKER" ? "TRUCKER" : "SHIPPER";

  const email = role === "TRUCKER" ? "demo_trucker@nexhaul.in" : "demo_shipper@nexhaul.in";
  const name = role === "TRUCKER" ? "National Highways Operator (NexHaul)" : "Reliance Logistics (NexHaul)";
  const rawPassword = "demo_password_123";

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (!existingUser) {
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      await prisma.user.create({
        data: {
          email,
          name,
          role: role as "SHIPPER" | "TRUCKER",
          passwordHash,
        },
      });
    } else if (existingUser.role !== role) {
      await prisma.user.update({
        where: { email },
        data: { role: role as "SHIPPER" | "TRUCKER" },
      });
    }
  } catch (error) {
    console.error("Failed to provision demo user:", error);
    return NextResponse.json({ error: "Failed to initialize demo account in PostgreSQL" }, { status: 500 });
  }

  // Execute server-side NextAuth credentials sign in and redirect to dashboard with role parameter
  await signIn("credentials", {
    email,
    password: rawPassword,
    redirectTo: `/dashboard?demoRole=${role}`,
  });

  return NextResponse.redirect(new URL(`/dashboard?demoRole=${role}`, req.url));
}
