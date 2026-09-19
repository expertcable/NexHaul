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

    if (!matchId || !["ACCEPT", "REJECT", "ARCHIVE"].includes(action)) {
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
      const updatedCapacity = Math.max(
        0,
        Number(match.journey.availableCapacityKg) - Number(match.load.weightKg)
      );

      // Transition Match to ACCEPTED, Load to MATCHED, and deduct booked capacity from Journey
      await prisma.$transaction([
        prisma.match.update({
          where: { id: matchId },
          data: { status: "ACCEPTED" },
        }),
        prisma.load.update({
          where: { id: match.loadId },
          data: { status: "BOOKED" },
        }),
        prisma.journey.update({
          where: { id: match.journeyId },
          data: {
            availableCapacityKg: updatedCapacity,
            ...(updatedCapacity === 0 ? { status: "MATCHED" } : { status: "AVAILABLE" }),
          },
        }),
      ]);
      return NextResponse.json({ success: true, status: "ACCEPTED" }, { status: 200 });
    } else if (action === "REJECT") {
      // Transition Match to REJECTED
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ success: true, status: "REJECTED" }, { status: 200 });
    } else if (action === "ARCHIVE") {
      // Transition Match to ARCHIVED
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "ARCHIVED" },
      });
      return NextResponse.json({ success: true, status: "ARCHIVED" }, { status: 200 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
