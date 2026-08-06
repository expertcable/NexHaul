import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, action } = await req.json();

    if (!matchId || !["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action or matchId provided" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { journey: true, load: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match request not found" }, { status: 404 });
    }

    if (action === "ACCEPT") {
      // Transition Match to ACCEPTED, Load & Journey to MATCHED (LPP OPTIMIZED)
      await prisma.$transaction([
        prisma.match.update({
          where: { id: matchId },
          data: { status: "ACCEPTED" },
        }),
        prisma.load.update({
          where: { id: match.loadId },
          data: { status: "MATCHED" },
        }),
        prisma.journey.update({
          where: { id: match.journeyId },
          data: { status: "MATCHED" },
        }),
      ]);
      return NextResponse.json({ success: true, status: "ACCEPTED" }, { status: 200 });
    } else {
      // Transition Match to REJECTED
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ success: true, status: "REJECTED" }, { status: 200 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
